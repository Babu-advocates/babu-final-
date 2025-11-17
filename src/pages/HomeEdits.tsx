import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/lib/toast";
import { Upload, Trash2, Edit, Image as ImageIcon } from "lucide-react";
import { uploadToR2 } from "@/lib/r2Storage";

interface GalleryImage {
  name: string;
  publicUrl: string;
  dbRecord?: {
    id: string;
    display_order: number;
    title: string | null;
    description: string | null;
  };
}

const HomeEdits = () => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteFileName, setDeleteFileName] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editOrder, setEditOrder] = useState(1);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadOrderNo, setUploadOrderNo] = useState<number>(1);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      // Fetch from storage bucket
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('gallery')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (storageError) throw storageError;

      // Fetch from database
      const { data: dbRecords, error: dbError } = await supabase
        .from('gallery_images')
        .select('*');

      if (dbError) throw dbError;

      // Filter image files
      const imageFiles = storageFiles?.filter(file => 
        file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
      ) || [];

      // Sync missing images to database
      const missingImages = imageFiles.filter(file => 
        !dbRecords?.find(r => r.file_name === file.name)
      );

      if (missingImages.length > 0) {
        const maxOrder = dbRecords?.reduce((max, record) => 
          record.display_order > max ? record.display_order : max, 0
        ) || 0;

        const newRecords = missingImages.map((file, index) => {
          const { data: { publicUrl } } = supabase.storage
            .from('gallery')
            .getPublicUrl(file.name);

          return {
            file_name: file.name,
            file_path: publicUrl,
            display_order: maxOrder + index + 1,
            title: file.name.replace(/\.[^/.]+$/, '')
          };
        });

        const { error: insertError } = await supabase
          .from('gallery_images')
          .insert(newRecords);

        if (insertError) {
          console.error('Error syncing images:', insertError);
        } else {
          showToast.success(`Synced ${missingImages.length} images to database`);
          // Refetch to get updated data
          const { data: updatedRecords } = await supabase
            .from('gallery_images')
            .select('*');
          
          dbRecords?.push(...(updatedRecords || []).filter(r => 
            !dbRecords.find(existing => existing.id === r.id)
          ));
        }
      }

      // Combine storage and database data
      const imagesList = imageFiles.map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('gallery')
          .getPublicUrl(file.name);

        const dbRecord = dbRecords?.find(r => r.file_name === file.name);

        return {
          name: file.name,
          publicUrl,
          dbRecord: dbRecord ? {
            id: dbRecord.id,
            display_order: dbRecord.display_order,
            title: dbRecord.title,
            description: dbRecord.description
          } : undefined
        };
      });

      // Sort by display_order if available
      imagesList.sort((a, b) => {
        const orderA = a.dbRecord?.display_order || 999;
        const orderB = b.dbRecord?.display_order || 999;
        return orderA - orderB;
      });

      setImages(imagesList);
    } catch (error) {
      console.error('Error fetching images:', error);
      showToast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile) {
      showToast.error('Please select an image file');
      return;
    }

    if (!uploadFile.type.startsWith('image/')) {
      showToast.error('Please select an image file');
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const sanitizedName = uploadFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${sanitizedName}`;
      
      // Upload to storage bucket
      const { error: uploadError } = await supabase.storage
        .from('gallery')
        .upload(fileName, uploadFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('gallery')
        .getPublicUrl(fileName);

      // Create database record
      const { error: dbError } = await supabase
        .from('gallery_images')
        .insert({
          file_name: fileName,
          file_path: publicUrl,
          display_order: uploadOrderNo,
          title: uploadFile.name.replace(/\.[^/.]+$/, ''),
        });

      if (dbError) throw dbError;

      showToast.success('Image uploaded successfully');
      setUploadDialogOpen(false);
      setUploadFile(null);
      setUploadOrderNo(1);
      fetchImages();
    } catch (error) {
      console.error('Error uploading image:', error);
      showToast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleOpenUploadDialog = () => {
    const maxOrder = images.reduce((max, img) => {
      const order = img.dbRecord?.display_order || 0;
      return order > max ? order : max;
    }, 0);
    setUploadOrderNo(maxOrder + 1);
    setUploadDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteFileName) return;

    try {
      const imageToDelete = images.find(img => img.name === deleteFileName);
      if (!imageToDelete) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('gallery')
        .remove([deleteFileName]);

      if (storageError) throw storageError;

      // Delete from database if exists
      if (imageToDelete.dbRecord) {
        const { error: dbError } = await supabase
          .from('gallery_images')
          .delete()
          .eq('id', imageToDelete.dbRecord.id);

        if (dbError) throw dbError;
      }

      showToast.success('Image deleted successfully');
      fetchImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      showToast.error('Failed to delete image');
    } finally {
      setDeleteFileName(null);
    }
  };

  const handleEditClick = (image: GalleryImage) => {
    setEditingImage(image);
    setEditTitle(image.dbRecord?.title || image.name.replace(/\.[^/.]+$/, ''));
    setEditOrder(image.dbRecord?.display_order || 1);
  };

  const handleSaveEdit = async () => {
    if (!editingImage) return;

    try {
      if (editingImage.dbRecord) {
        // Update existing record
        const { error } = await supabase
          .from('gallery_images')
          .update({
            title: editTitle,
            display_order: editOrder
          })
          .eq('id', editingImage.dbRecord.id);

        if (error) throw error;
      } else {
        // Create new record
        const { data: { publicUrl } } = supabase.storage
          .from('gallery')
          .getPublicUrl(editingImage.name);

        const { error } = await supabase
          .from('gallery_images')
          .insert({
            file_name: editingImage.name,
            file_path: publicUrl,
            display_order: editOrder,
            title: editTitle
          });

        if (error) throw error;
      }

      showToast.success('Image updated successfully');
      setEditingImage(null);
      fetchImages();
    } catch (error) {
      console.error('Error updating image:', error);
      showToast.error('Failed to update image');
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-slate-800 mb-2">Home Gallery Management</h1>
              <p className="text-slate-600">Upload, manage, and reorder gallery images for the home page</p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload New Image
                </CardTitle>
                <CardDescription>
                  Click the button below to upload a new image with custom display order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleOpenUploadDialog}
                  disabled={uploading}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload New Image
                </Button>
              </CardContent>
            </Card>

            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading images...</p>
              </div>
            ) : images.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ImageIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No images uploaded yet. Upload your first image to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((image) => (
                  <Card key={image.name} className="group relative overflow-hidden">
                    <CardContent className="p-0">
                      <div 
                        className="relative cursor-pointer"
                        onClick={() => handleEditClick(image)}
                      >
                        <img
                          src={image.publicUrl}
                          alt={image.dbRecord?.title || image.name}
                          className="w-full h-64 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Edit className="h-8 w-8 text-white" />
                        </div>
                        
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteFileName(image.name);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="p-4">
                        <h3 className="font-semibold text-sm truncate mb-1">
                          {image.dbRecord?.title || image.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Order: {image.dbRecord?.display_order || 'Not set'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>

        <AlertDialog open={!!deleteFileName} onOpenChange={() => setDeleteFileName(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Image</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this image? This action cannot be undone and will remove the image from both storage and database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload New Image</DialogTitle>
              <DialogDescription>
                Select an image and set its display order in the gallery
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="upload-file">Image File</Label>
                <Input
                  id="upload-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: JPG, PNG, GIF, WEBP
                </p>
              </div>

              {uploadFile && (
                <div className="rounded-lg overflow-hidden bg-muted p-4">
                  <p className="text-sm font-medium mb-2">Selected File:</p>
                  <p className="text-sm text-muted-foreground">{uploadFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Size: {(uploadFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="upload-order">Display Order</Label>
                <Input
                  id="upload-order"
                  type="number"
                  min="1"
                  value={uploadOrderNo}
                  onChange={(e) => setUploadOrderNo(parseInt(e.target.value) || 1)}
                  placeholder="Enter display order"
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first. Suggested: {uploadOrderNo}
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setUploadDialogOpen(false);
                    setUploadFile(null);
                  }}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleUploadSubmit}
                  disabled={uploading || !uploadFile}
                >
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Image Details</DialogTitle>
              <DialogDescription>
                Update the title and display order for this image
              </DialogDescription>
            </DialogHeader>
            
            {editingImage && (
              <div className="space-y-4">
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={editingImage.publicUrl}
                    alt={editingImage.name}
                    className="w-full h-48 object-cover"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-title">Title</Label>
                  <Input
                    id="edit-title"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Enter image title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-order">Display Order</Label>
                  <Input
                    id="edit-order"
                    type="number"
                    min="1"
                    value={editOrder}
                    onChange={(e) => setEditOrder(parseInt(e.target.value) || 1)}
                    placeholder="Enter display order"
                  />
                </div>

                <div className="text-xs text-muted-foreground">
                  File: {editingImage.name}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setEditingImage(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveEdit}>
                    Save Changes
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default HomeEdits;
