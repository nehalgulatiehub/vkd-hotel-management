import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [companyName, setCompanyName] = useState("Company");

  useEffect(() => {
    const fetchCompanyName = async () => {
      const { data } = await supabase
        .from("company_settings")
        .select("company_name")
        .limit(1)
        .single();
      
      if (data?.company_name) {
        setCompanyName(data.company_name);
      }
    };

    fetchCompanyName();
  }, []);

  return (
    <div className="h-full">
      {/* Blue Header Bar */}
      <div 
        className="rounded-t-[2rem] h-10"
        style={{ 
          background: 'linear-gradient(to right, #1e6e99, #2a8ab8)' 
        }}
      />
      
      {/* Content Area */}
      <div className="bg-white border-x border-gray-300 p-6 min-h-[300px]">
        <h2 className="text-[#333] font-medium text-base mb-3">
          Welcome {companyName} !
        </h2>
        <p className="text-gray-600 text-sm">
          Please use the navigation links on the left side to access different sections of the office management system.
        </p>
      </div>
      
      {/* Blue Footer Bar */}
      <div 
        className="rounded-b-[2rem] h-10"
        style={{ 
          background: 'linear-gradient(to right, #1e6e99, #2a8ab8)' 
        }}
      />
    </div>
  );
}
