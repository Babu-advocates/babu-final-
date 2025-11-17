import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FloatingInput } from "@/components/ui/floating-input";
import { FloatingTextarea } from "@/components/ui/floating-textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Loader2, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const ContactForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_number: "",
    message: "",
  });
  const [document, setDocument] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocument(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: "Required fields missing",
        description: "Please fill in name and email",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let documentUrl = null;

      // Upload document if provided
      if (document) {
        const fileExt = document.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `contact-documents/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('query-attachments')
          .upload(filePath, document);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('query-attachments')
          .getPublicUrl(filePath);

        documentUrl = publicUrl;
      }

      // Insert contact submission
      const { error: insertError } = await supabase
        .from('contact_submissions')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            phone_number: formData.phone_number || null,
            message: formData.message || null,
            document_url: documentUrl,
          },
        ]);

      if (insertError) throw insertError;

      toast({
        title: "Your query has successfully submitted to the advocate",
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone_number: "",
        message: "",
      });
      setDocument(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (e.target) {
        const form = e.target as HTMLFormElement;
        form.reset();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error sending message",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-elegant border-primary/20 bg-white dark:bg-gray-950">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">
          Send Us a Message
        </CardTitle>
        <CardDescription className="text-base">
          Fill out the form below and we'll respond as soon as possible
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FloatingInput
            id="name"
            type="text"
            label="Name *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="transition-all"
          />

          <FloatingInput
            id="email"
            type="email"
            label="Email *"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="transition-all"
          />

          <FloatingInput
            id="phone"
            type="tel"
            label="Phone Number"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            className="transition-all"
          />

          <FloatingTextarea
            id="message"
            label="Message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={5}
            className="resize-none transition-all"
          />

          <div className="space-y-2">
            <Label htmlFor="document" className="text-sm font-medium">
              Upload Documents
            </Label>
            <div className="flex items-center gap-3">
              <Input
                id="document"
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="flex-1 transition-all focus:ring-2 focus:ring-primary/20"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            {document && (
              <p className="text-xs text-muted-foreground">
                Selected: {document.name}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 text-base font-semibold relative overflow-hidden group"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                Send Message
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
