import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Upload, Building2, Eye, EyeOff } from "lucide-react";

interface CompanySettings {
  id: string;
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
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<"settings" | "change-password">("settings");
  const [settings, setSettings] = useState<CompanySettings>({
    id: '',
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
    terms_conditions: 'This is computer generated invoice no signature and stamp required.'
  });
  const [isSaving, setIsSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ newPassword: "", confirmPassword: "" });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from("company_settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to load settings", error);
    } else if (data) {
      setSettings(data);
      if (data.logo_url) {
        setLogoPreview(data.logo_url);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (settings.id) {
        // Update existing
        const { error } = await supabase
          .from("company_settings")
          .update({
            company_name: settings.company_name,
            sub_title: settings.sub_title,
            address: settings.address,
            contact_no: settings.contact_no,
            gstin: settings.gstin,
            pan_no: settings.pan_no,
            hsn_code: settings.hsn_code,
            logo_url: settings.logo_url,
            bank_name: settings.bank_name,
            account_no: settings.account_no,
            ifsc_code: settings.ifsc_code,
            branch_name: settings.branch_name,
            terms_conditions: settings.terms_conditions,
            updated_at: new Date().toISOString()
          })
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("company_settings")
          .insert({
            company_name: settings.company_name,
            sub_title: settings.sub_title,
            address: settings.address,
            contact_no: settings.contact_no,
            gstin: settings.gstin,
            pan_no: settings.pan_no,
            hsn_code: settings.hsn_code,
            logo_url: settings.logo_url,
            bank_name: settings.bank_name,
            account_no: settings.account_no,
            ifsc_code: settings.ifsc_code,
            branch_name: settings.branch_name,
            terms_conditions: settings.terms_conditions
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setSettings(data);
      }
      
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Failed to save settings", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUrlChange = (url: string) => {
    setSettings({ ...settings, logo_url: url });
    setLogoPreview(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="Settings" />
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage company settings for billing invoices</p>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Basic company details that appear on invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Company Name *</Label>
                <Input
                  value={settings.company_name}
                  onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <Label>Sub Title / Tagline</Label>
                <Input
                  value={settings.sub_title || ''}
                  onChange={(e) => setSettings({ ...settings, sub_title: e.target.value })}
                  placeholder="E.g., (A Unit of XYZ Hotels Pvt Ltd)"
                />
              </div>
              <div>
                <Label>Address</Label>
                <Textarea
                  value={settings.address || ''}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  placeholder="Enter full address"
                  rows={3}
                />
              </div>
              <div>
                <Label>Contact Number</Label>
                <Input
                  value={settings.contact_no || ''}
                  onChange={(e) => setSettings({ ...settings, contact_no: e.target.value })}
                  placeholder="Enter contact number"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>GSTIN</Label>
                  <Input
                    value={settings.gstin || ''}
                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                    placeholder="Enter GSTIN"
                  />
                </div>
                <div>
                  <Label>PAN Number</Label>
                  <Input
                    value={settings.pan_no || ''}
                    onChange={(e) => setSettings({ ...settings, pan_no: e.target.value })}
                    placeholder="Enter PAN"
                  />
                </div>
              </div>
              <div>
                <Label>HSN/SAC Code</Label>
                <Input
                  value={settings.hsn_code || ''}
                  onChange={(e) => setSettings({ ...settings, hsn_code: e.target.value })}
                  placeholder="Enter HSN/SAC Code"
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo & Bank Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Company Logo
                </CardTitle>
                <CardDescription>
                  Add your company logo URL for invoices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Logo URL</Label>
                  <Input
                    value={settings.logo_url || ''}
                    onChange={(e) => handleLogoUrlChange(e.target.value)}
                    placeholder="Enter logo URL (https://...)"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the URL of your company logo image
                  </p>
                </div>
                {logoPreview && (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <Label className="text-sm mb-2 block">Preview:</Label>
                    <img 
                      src={logoPreview} 
                      alt="Logo Preview" 
                      className="h-20 w-auto object-contain"
                      onError={() => setLogoPreview('')}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
                <CardDescription>
                  Bank account details for payment collection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Bank Name</Label>
                  <Input
                    value={settings.bank_name || ''}
                    onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                    placeholder="Enter bank name"
                  />
                </div>
                <div>
                  <Label>Account Number</Label>
                  <Input
                    value={settings.account_no || ''}
                    onChange={(e) => setSettings({ ...settings, account_no: e.target.value })}
                    placeholder="Enter account number"
                  />
                </div>
                <div>
                  <Label>IFSC Code</Label>
                  <Input
                    value={settings.ifsc_code || ''}
                    onChange={(e) => setSettings({ ...settings, ifsc_code: e.target.value })}
                    placeholder="Enter IFSC code"
                  />
                </div>
                <div>
                  <Label>Branch Name</Label>
                  <Input
                    value={settings.branch_name || ''}
                    onChange={(e) => setSettings({ ...settings, branch_name: e.target.value })}
                    placeholder="Enter branch name"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Terms & Conditions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Terms & Conditions</CardTitle>
              <CardDescription>
                Terms and conditions that appear at the bottom of invoices
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.terms_conditions || ''}
                onChange={(e) => setSettings({ ...settings, terms_conditions: e.target.value })}
                placeholder="Enter terms and conditions"
                rows={4}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
