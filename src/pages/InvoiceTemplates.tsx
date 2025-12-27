import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Plus, Trash2, Check, Building2, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface InvoiceTemplate {
  id: string;
  template_name: string;
  company_name: string;
  sub_title: string | null;
  address: string | null;
  contact_no: string | null;
  gstin: string | null;
  pan_no: string | null;
  hsn_code: string | null;
  logo_url: string | null;
  bank_name: string | null;
  account_no: string | null;
  ifsc_code: string | null;
  branch_name: string | null;
  terms_conditions: string | null;
  is_default: boolean;
}

const emptyTemplate: Omit<InvoiceTemplate, 'id'> = {
  template_name: '',
  company_name: '',
  sub_title: '',
  address: '',
  contact_no: '',
  gstin: '',
  pan_no: '',
  hsn_code: '996311',
  logo_url: '',
  bank_name: '',
  account_no: '',
  ifsc_code: '',
  branch_name: '',
  terms_conditions: 'This is computer generated invoice no signature and stamp required.',
  is_default: false
};

export default function InvoiceTemplates() {
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<InvoiceTemplate> | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("invoice_templates")
      .select("*")
      .order("is_default", { ascending: false })
      .order("template_name");

    if (error) {
      console.error("Failed to load templates", error);
      toast.error("Failed to load templates");
    } else {
      setTemplates(data || []);
    }
    setIsLoading(false);
  };

  const openCreateDialog = () => {
    setEditingTemplate({ ...emptyTemplate });
    setLogoPreview('');
    setDialogOpen(true);
  };

  const openEditDialog = (template: InvoiceTemplate) => {
    setEditingTemplate(template);
    setLogoPreview(template.logo_url || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingTemplate?.template_name?.trim()) {
      toast.error("Please enter a template name");
      return;
    }
    if (!editingTemplate?.company_name?.trim()) {
      toast.error("Please enter a company name");
      return;
    }

    setIsSaving(true);
    try {
      if ('id' in editingTemplate && editingTemplate.id) {
        // Update existing
        const { error } = await supabase
          .from("invoice_templates")
          .update({
            template_name: editingTemplate.template_name,
            company_name: editingTemplate.company_name,
            sub_title: editingTemplate.sub_title,
            address: editingTemplate.address,
            contact_no: editingTemplate.contact_no,
            gstin: editingTemplate.gstin,
            pan_no: editingTemplate.pan_no,
            hsn_code: editingTemplate.hsn_code,
            logo_url: editingTemplate.logo_url,
            bank_name: editingTemplate.bank_name,
            account_no: editingTemplate.account_no,
            ifsc_code: editingTemplate.ifsc_code,
            branch_name: editingTemplate.branch_name,
            terms_conditions: editingTemplate.terms_conditions,
          })
          .eq("id", editingTemplate.id);

        if (error) throw error;
        toast.success("Template updated");
      } else {
        // Insert new
        const { error } = await supabase
          .from("invoice_templates")
          .insert({
            template_name: editingTemplate.template_name,
            company_name: editingTemplate.company_name,
            sub_title: editingTemplate.sub_title,
            address: editingTemplate.address,
            contact_no: editingTemplate.contact_no,
            gstin: editingTemplate.gstin,
            pan_no: editingTemplate.pan_no,
            hsn_code: editingTemplate.hsn_code,
            logo_url: editingTemplate.logo_url,
            bank_name: editingTemplate.bank_name,
            account_no: editingTemplate.account_no,
            ifsc_code: editingTemplate.ifsc_code,
            branch_name: editingTemplate.branch_name,
            terms_conditions: editingTemplate.terms_conditions,
            is_default: templates.length === 0 // First template is default
          });

        if (error) throw error;
        toast.success("Template created");
      }

      setDialogOpen(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error("Failed to save template", error);
      toast.error("Failed to save template");
    } finally {
      setIsSaving(false);
    }
  };

  const setAsDefault = async (templateId: string) => {
    try {
      // First, unset all defaults
      await supabase
        .from("invoice_templates")
        .update({ is_default: false })
        .neq("id", templateId);

      // Set the selected one as default
      const { error } = await supabase
        .from("invoice_templates")
        .update({ is_default: true })
        .eq("id", templateId);

      if (error) throw error;
      toast.success("Default template updated");
      fetchTemplates();
    } catch (error) {
      console.error("Failed to set default", error);
      toast.error("Failed to set default template");
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase
        .from("invoice_templates")
        .delete()
        .eq("id", templateId);

      if (error) throw error;
      toast.success("Template deleted");
      fetchTemplates();
    } catch (error) {
      console.error("Failed to delete template", error);
      toast.error("Failed to delete template");
    }
  };

  const updateField = (field: keyof InvoiceTemplate, value: string | boolean) => {
    if (editingTemplate) {
      setEditingTemplate({ ...editingTemplate, [field]: value });
      if (field === 'logo_url') {
        setLogoPreview(value as string);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Invoice Templates" />
      <main className="container mx-auto p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">Invoice Templates</h1>
            <p className="text-xs text-muted-foreground">Manage company templates for billing invoices</p>
          </div>
          <Button size="sm" onClick={openCreateDialog}>
            <Plus className="h-3 w-3 mr-1" />
            Add Template
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : templates.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <Building2 className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-3">No templates yet</p>
              <Button size="sm" onClick={openCreateDialog}>
                <Plus className="h-3 w-3 mr-1" />
                Create First Template
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map(template => (
              <Card key={template.id} className={`relative ${template.is_default ? 'ring-2 ring-primary' : ''}`}>
                {template.is_default && (
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded">
                    Default
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {template.logo_url ? (
                      <img src={template.logo_url} alt="" className="h-6 w-6 object-contain" />
                    ) : (
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    )}
                    {template.template_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <div>
                    <p className="text-xs font-medium">{template.company_name}</p>
                    {template.sub_title && <p className="text-[10px] text-muted-foreground">{template.sub_title}</p>}
                  </div>
                  {template.gstin && (
                    <p className="text-[10px] text-muted-foreground">GSTIN: {template.gstin}</p>
                  )}
                  <div className="flex gap-1 pt-2">
                    <Button size="sm" variant="outline" className="h-7 text-[10px] flex-1" onClick={() => openEditDialog(template)}>
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    {!template.is_default && (
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => setAsDefault(template.id)}>
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-7 text-[10px] text-destructive">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Template?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete "{template.template_name}".
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteTemplate(template.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base">
                {editingTemplate && 'id' in editingTemplate ? 'Edit Template' : 'Create Template'}
              </DialogTitle>
            </DialogHeader>
            {editingTemplate && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Template Name *</Label>
                    <Input
                      value={editingTemplate.template_name || ''}
                      onChange={(e) => updateField('template_name', e.target.value)}
                      placeholder="e.g., Main Company"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Company Name *</Label>
                    <Input
                      value={editingTemplate.company_name || ''}
                      onChange={(e) => updateField('company_name', e.target.value)}
                      placeholder="Enter company name"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Sub Title / Tagline</Label>
                  <Input
                    value={editingTemplate.sub_title || ''}
                    onChange={(e) => updateField('sub_title', e.target.value)}
                    placeholder="E.g., (A Unit of XYZ Hotels Pvt Ltd)"
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">Address</Label>
                  <Textarea
                    value={editingTemplate.address || ''}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="Enter full address"
                    rows={2}
                    className="text-xs"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Contact Number</Label>
                    <Input
                      value={editingTemplate.contact_no || ''}
                      onChange={(e) => updateField('contact_no', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">GSTIN</Label>
                    <Input
                      value={editingTemplate.gstin || ''}
                      onChange={(e) => updateField('gstin', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">PAN Number</Label>
                    <Input
                      value={editingTemplate.pan_no || ''}
                      onChange={(e) => updateField('pan_no', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">HSN/SAC Code</Label>
                    <Input
                      value={editingTemplate.hsn_code || ''}
                      onChange={(e) => updateField('hsn_code', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Logo URL</Label>
                    <Input
                      value={editingTemplate.logo_url || ''}
                      onChange={(e) => updateField('logo_url', e.target.value)}
                      placeholder="https://..."
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                {logoPreview && (
                  <div className="border rounded p-2 bg-muted/50">
                    <img src={logoPreview} alt="Logo Preview" className="h-12 object-contain" onError={() => setLogoPreview('')} />
                  </div>
                )}

                <div className="border-t pt-3">
                  <p className="text-xs font-medium mb-2">Bank Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Bank Name</Label>
                      <Input
                        value={editingTemplate.bank_name || ''}
                        onChange={(e) => updateField('bank_name', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Account Number</Label>
                      <Input
                        value={editingTemplate.account_no || ''}
                        onChange={(e) => updateField('account_no', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">IFSC Code</Label>
                      <Input
                        value={editingTemplate.ifsc_code || ''}
                        onChange={(e) => updateField('ifsc_code', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Branch Name</Label>
                      <Input
                        value={editingTemplate.branch_name || ''}
                        onChange={(e) => updateField('branch_name', e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Terms & Conditions</Label>
                  <Textarea
                    value={editingTemplate.terms_conditions || ''}
                    onChange={(e) => updateField('terms_conditions', e.target.value)}
                    rows={2}
                    className="text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    <Save className="h-3 w-3 mr-1" />
                    {isSaving ? 'Saving...' : 'Save Template'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
