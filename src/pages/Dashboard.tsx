import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Quote } from "lucide-react";

export default function Dashboard() {
  const [companyName, setCompanyName] = useState("Company");
  const [quote, setQuote] = useState<{ text: string; author: string } | null>(null);

  useEffect(() => {
    const fetchCompanyName = async () => {
      const { data } = await supabase
        .from("company_settings")
        .select("company_name")
        .limit(1)
        .single();
      if (data?.company_name) setCompanyName(data.company_name);
    };

    const fetchRandomQuote = async () => {
      const { data } = await supabase
        .from("quotes")
        .select("text, author")
        .order("created_at", { ascending: false });
      if (data && data.length > 0) {
        const random = data[Math.floor(Math.random() * data.length)];
        setQuote(random);
      }
    };

    fetchCompanyName();
    fetchRandomQuote();
  }, []);

  return (
    <div className="h-full">
      {/* Blue Header Bar */}
      <div 
        className="rounded-t-[2rem] h-10"
        style={{ background: 'linear-gradient(to right, #1e6e99, #2a8ab8)' }}
      />
      
      {/* Content Area */}
      <div className="bg-white border-x border-gray-300 p-6 min-h-[300px]">
        <h2 className="text-[#333] font-medium text-base mb-3">
          Welcome {companyName} !
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Please use the navigation links on the left side to access different sections of the office management system.
        </p>

        {quote && (
          <div className="max-w-lg mx-auto mt-4 p-5 rounded-lg border bg-muted/30">
            <div className="flex gap-3">
              <Quote className="h-6 w-6 text-primary/60 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm italic text-foreground/80 leading-relaxed">"{quote.text}"</p>
                {quote.author && (
                  <p className="text-xs text-muted-foreground mt-2 font-medium">— {quote.author}</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Blue Footer Bar */}
      <div 
        className="rounded-b-[2rem] h-10"
        style={{ background: 'linear-gradient(to right, #1e6e99, #2a8ab8)' }}
      />
    </div>
  );
}
