import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, subDays, eachDayOfInterval, startOfMonth } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBookings: 0, confirmedBookings: 0, cancelledBookings: 0, holdBookings: 0,
    totalRevenue: 0, totalPaid: 0, totalDue: 0,
    pendingPayments: 0, approvedPayments: 0,
    totalUsers: 0, totalAgents: 0, totalHotels: 0, totalTransporters: 0,
    todayBookings: 0, monthRevenue: 0,
  });
  const [bookingTrend, setBookingTrend] = useState<any[]>([]);
  const [paymentStatusData, setPaymentStatusData] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [todayCheckins, setTodayCheckins] = useState<any[]>([]);
  const [todayCheckouts, setTodayCheckouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchBookingTrend(), fetchRecentBookings(), fetchCheckinCheckout()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const [bookingsRes, paymentsRes, profilesRes, agentsRes, hotelsRes, transportersRes] = await Promise.all([
      supabase.from("bookings").select("id, status, total_amount, paid_amount, due_amount, created_at, is_hold"),
      supabase.from("payments").select("id, amount, approval_status, payment_type, created_at"),
      supabase.from("profiles").select("id"),
      supabase.from("agents").select("id"),
      supabase.from("another_hotels").select("id"),
      supabase.from("transporters").select("id"),
    ]);

    const bookings = bookingsRes.data || [];
    const payments = paymentsRes.data || [];
    const today = format(new Date(), "yyyy-MM-dd");
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");

    const confirmed = bookings.filter(b => b.status === "confirmed").length;
    const cancelled = bookings.filter(b => b.status === "cancelled").length;
    const hold = bookings.filter(b => b.is_hold).length;
    const totalRevenue = bookings.reduce((s, b) => s + (b.total_amount || 0), 0);
    const totalPaid = bookings.reduce((s, b) => s + (b.paid_amount || 0), 0);
    const totalDue = bookings.reduce((s, b) => s + (b.due_amount || 0), 0);
    const todayBookings = bookings.filter(b => b.created_at?.startsWith(today)).length;
    const monthBookings = bookings.filter(b => b.created_at && b.created_at >= monthStart);
    const monthRevenue = monthBookings.reduce((s, b) => s + (b.total_amount || 0), 0);

    const pending = payments.filter(p => p.approval_status === "pending").length;
    const approved = payments.filter(p => p.approval_status === "approved").length;

    setStats({
      totalBookings: bookings.length, confirmedBookings: confirmed, cancelledBookings: cancelled, holdBookings: hold,
      totalRevenue, totalPaid, totalDue,
      pendingPayments: pending, approvedPayments: approved,
      totalUsers: (profilesRes.data || []).length,
      totalAgents: (agentsRes.data || []).length,
      totalHotels: (hotelsRes.data || []).length,
      totalTransporters: (transportersRes.data || []).length,
      todayBookings, monthRevenue,
    });

    setPaymentStatusData([
      { name: "Pending", value: pending, color: "#e6a817" },
      { name: "Approved", value: approved, color: "#2e7d32" },
      { name: "Rejected", value: payments.filter(p => p.approval_status === "rejected").length, color: "#c62828" },
    ].filter(d => d.value > 0));
  };

  const fetchBookingTrend = async () => {
    const last30 = subDays(new Date(), 29);
    const { data } = await supabase.from("bookings").select("created_at, total_amount").gte("created_at", last30.toISOString()).order("created_at");

    const dayMap: Record<string, { count: number; revenue: number }> = {};
    eachDayOfInterval({ start: last30, end: new Date() }).forEach(d => {
      dayMap[format(d, "MM/dd")] = { count: 0, revenue: 0 };
    });
    (data || []).forEach(b => {
      const key = format(new Date(b.created_at), "MM/dd");
      if (dayMap[key]) { dayMap[key].count++; dayMap[key].revenue += b.total_amount || 0; }
    });
    setBookingTrend(Object.entries(dayMap).map(([date, v]) => ({ date, bookings: v.count, revenue: v.revenue })));
  };

  const fetchRecentBookings = async () => {
    const { data } = await supabase.from("bookings").select("id, booking_number, customer_name, total_amount, status, created_at").order("created_at", { ascending: false }).limit(8);
    setRecentBookings(data || []);
  };

  const fetchCheckinCheckout = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const [checkinRes, checkoutRes] = await Promise.all([
      supabase.from("bookings").select("id, booking_number, customer_name, contact_no, adults, children, check_in_date, check_out_date, agent:agents(name)").eq("check_in_date", today).in("status", ["confirmed", "completed"]).order("booking_number"),
      supabase.from("bookings").select("id, booking_number, customer_name, contact_no, adults, children, check_in_date, check_out_date, agent:agents(name)").eq("check_out_date", today).in("status", ["confirmed", "completed"]).order("booking_number"),
    ]);
    setTodayCheckins(checkinRes.data || []);
    setTodayCheckouts(checkoutRes.data || []);
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: "Arial", fontSize: 12, color: "#666" }}>
      Loading dashboard...
    </div>
  );

  const s: React.CSSProperties = { fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 };

  return (
    <div style={{ ...s, padding: 12, background: "#f5f5f5", minHeight: "100vh" }}>
      {/* Top Bar */}
      <div style={{ background: "#b44a50", color: "#fff", padding: "8px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontWeight: "bold", fontSize: 13 }}>Admin Dashboard</span>
        <span style={{ fontSize: 11 }}>{format(new Date(), "dd-MMM-yyyy, EEEE")}</span>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Today's Bookings", val: stats.todayBookings, bg: "#fff" },
          { label: "Total Bookings", val: stats.totalBookings, bg: "#fff" },
          { label: "This Month Revenue", val: fmt(stats.monthRevenue), bg: "#fff" },
          { label: "Pending Payments", val: stats.pendingPayments, bg: "#fff" },
        ].map((c, i) => (
          <div key={i} style={{ background: c.bg, border: "1px solid #ccc", padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#777", textTransform: "uppercase", fontWeight: "bold", marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#333" }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Confirmed", val: stats.confirmedBookings, color: "#2e7d32" },
          { label: "Cancelled", val: stats.cancelledBookings, color: "#c62828" },
          { label: "On Hold", val: stats.holdBookings, color: "#e6a817" },
          { label: "Approved Payments", val: stats.approvedPayments, color: "#1565c0" },
        ].map((c, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #ccc", padding: "10px 12px", borderTop: `3px solid ${c.color}` }}>
            <div style={{ fontSize: 10, color: "#777", textTransform: "uppercase", fontWeight: "bold", marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#333" }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
        {[
          { label: "Users", val: stats.totalUsers, link: "/admin/users" },
          { label: "Agents", val: stats.totalAgents, link: "/admin/agents" },
          { label: "Hotels", val: stats.totalHotels, link: "/admin/manage-hotels" },
          { label: "Transporters", val: stats.totalTransporters, link: "/admin/transporters" },
        ].map((c, i) => (
          <div key={i} onClick={() => navigate(c.link)} style={{
            background: "#fff", border: "1px solid #ccc", padding: "10px 12px", cursor: "pointer"
          }}>
            <div style={{ fontSize: 10, color: "#777", textTransform: "uppercase", fontWeight: "bold", marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#0066cc" }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Financial Summary Table */}
      <div style={{ background: "#fff", border: "1px solid #ccc", marginBottom: 12 }}>
        <div style={{ background: "#b44a50", color: "#fff", padding: "6px 12px", fontWeight: "bold", fontSize: 12 }}>
          Financial Summary
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <tbody>
            <tr style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "6px 12px", color: "#555", width: "25%" }}>Total Revenue</td>
              <td style={{ padding: "6px 12px", fontWeight: "bold" }}>{fmt(stats.totalRevenue)}</td>
              <td style={{ padding: "6px 12px", color: "#555", width: "25%" }}>Total Collected</td>
              <td style={{ padding: "6px 12px", fontWeight: "bold", color: "#2e7d32" }}>{fmt(stats.totalPaid)}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 12px", color: "#555" }}>Outstanding Due</td>
              <td style={{ padding: "6px 12px", fontWeight: "bold", color: "#c62828" }}>{fmt(stats.totalDue)}</td>
              <td style={{ padding: "6px 12px", color: "#555" }}>Collection Rate</td>
              <td style={{ padding: "6px 12px", fontWeight: "bold" }}>
                {stats.totalRevenue > 0 ? ((stats.totalPaid / stats.totalRevenue) * 100).toFixed(1) : 0}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 8, marginBottom: 12 }}>
        <div style={{ background: "#fff", border: "1px solid #ccc" }}>
          <div style={{ background: "#b44a50", color: "#fff", padding: "6px 12px", fontWeight: "bold", fontSize: 12 }}>
            Booking Trend (Last 30 Days)
          </div>
          <div style={{ padding: 10 }}>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={bookingTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} />
                <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 10, border: "1px solid #ccc" }} />
                <Area type="monotone" dataKey="bookings" stroke="#b44a50" fill="#b44a50" fillOpacity={0.1} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #ccc" }}>
          <div style={{ background: "#b44a50", color: "#fff", padding: "6px 12px", fontWeight: "bold", fontSize: 12 }}>
            Payment Status
          </div>
          <div style={{ padding: 10 }}>
            {paymentStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={paymentStatusData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false} style={{ fontSize: 9 }}>
                    {paymentStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div style={{ textAlign: "center", padding: 40, color: "#999", fontSize: 11 }}>No data</div>}
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div style={{ background: "#fff", border: "1px solid #ccc", marginBottom: 12 }}>
        <div style={{ background: "#b44a50", color: "#fff", padding: "6px 12px", fontWeight: "bold", fontSize: 12 }}>
          Revenue Trend (Last 30 Days)
        </div>
        <div style={{ padding: 10 }}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={bookingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ fontSize: 10, border: "1px solid #ccc" }} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#4a7a8a" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
