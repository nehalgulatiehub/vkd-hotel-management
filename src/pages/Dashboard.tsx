import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, subDays, eachDayOfInterval, startOfMonth } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalBookings: 0, confirmedBookings: 0, cancelledBookings: 0, holdBookings: 0,
    totalRevenue: 0, totalPaid: 0, totalDue: 0,
    pendingPayments: 0, approvedPayments: 0,
    totalAgents: 0, totalHotels: 0, totalTransporters: 0,
    todayBookings: 0, monthRevenue: 0,
  });
  const [bookingTrend, setBookingTrend] = useState<any[]>([]);
  const [paymentStatusData, setPaymentStatusData] = useState<any[]>([]);
  const [todayCheckins, setTodayCheckins] = useState<any[]>([]);
  const [todayCheckouts, setTodayCheckouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchBookingTrend(), fetchCheckinCheckout()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const [bookingsRes, paymentsRes, agentsRes, hotelsRes, transportersRes] = await Promise.all([
      supabase.from("bookings").select("id, status, total_amount, paid_amount, due_amount, created_at, is_hold"),
      supabase.from("payments").select("id, amount, approval_status, payment_type, created_at"),
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

  const fetchCheckinCheckout = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const [checkinRes, checkoutRes] = await Promise.all([
      supabase.from("bookings").select("id, booking_number, customer_name, contact_no, adults, children, check_in_date, check_out_date, agent:agents(name)").eq("check_in_date", today).in("status", ["confirmed", "completed"]).order("booking_number"),
      supabase.from("bookings").select("id, booking_number, customer_name, contact_no, adults, children, check_in_date, check_out_date, agent:agents(name)").eq("check_out_date", today).in("status", ["confirmed", "completed"]).order("booking_number"),
    ]);
    setTodayCheckins(checkinRes.data || []);
    setTodayCheckouts(checkoutRes.data || []);
  };

  const thStyle: React.CSSProperties = { padding: "5px 8px", textAlign: "left", fontWeight: "bold", fontSize: 11, borderBottom: "1px solid #a88" };
  const tdStyle: React.CSSProperties = { padding: "4px 8px", fontSize: 11 };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  if (loading) return (
    <div style={{ padding: 40, textAlign: "center", fontFamily: "Arial", fontSize: 12, color: "#666" }}>
      Loading dashboard...
    </div>
  );

  const s: React.CSSProperties = { fontFamily: "Arial, Helvetica, sans-serif", fontSize: 11 };

  const grid4: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 12 };
  const grid3: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8, marginBottom: 12 };

  return (
    <div style={{ ...s, padding: 12, background: "#f5f5f5", minHeight: "100vh" }}>
      {/* Top Bar */}
      <div style={{ background: "#b44a50", color: "#fff", padding: "8px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
        <span style={{ fontWeight: "bold", fontSize: 13 }}>Dashboard</span>
        <span style={{ fontSize: 11 }}>{format(new Date(), "dd/MM/yyyy, EEEE")}</span>
      </div>

      {/* Summary Cards */}
      <div style={grid4}>
        {[
          { label: "Today's Bookings", val: stats.todayBookings },
          { label: "Total Bookings", val: stats.totalBookings },
          { label: "This Month Revenue", val: fmt(stats.monthRevenue) },
          { label: "Pending Payments", val: stats.pendingPayments },
        ].map((c, i) => (
          <div key={i} style={{ background: "#fff", border: "1px solid #ccc", padding: "10px 12px" }}>
            <div style={{ fontSize: 10, color: "#777", textTransform: "uppercase", fontWeight: "bold", marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "#333" }}>{c.val}</div>
          </div>
        ))}
      </div>

      {/* Stats Row */}
      <div style={grid4}>
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
      <div style={grid3}>
        {[
          { label: "Agents", val: stats.totalAgents, link: "/agents" },
          { label: "Hotels", val: stats.totalHotels, link: "/hotels" },
          { label: "Transporters", val: stats.totalTransporters, link: "/transporters" },
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8, marginBottom: 12 }}>
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

      {/* Today's Check-in & Check-out */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 8, marginBottom: 12 }}>
        <div style={{ background: "#fff", border: "1px solid #ccc" }}>
          <div style={{ background: "#2e7d32", color: "#fff", padding: "6px 12px", fontWeight: "bold", fontSize: 12, display: "flex", justifyContent: "space-between" }}>
            <span>Today's Check-In</span>
            <span>{todayCheckins.length} booking(s)</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#c47a7e", color: "#fff" }}>
                  <th style={thStyle}>S.No</th>
                  <th style={thStyle}>Booking</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Contact</th>
                  <th style={thStyle}>Pax</th>
                  <th style={thStyle}>Check-out</th>
                  <th style={thStyle}>Agent</th>
                </tr>
              </thead>
              <tbody>
                {todayCheckins.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 16, textAlign: "center", color: "#999" }}>No check-ins today</td></tr>
                ) : todayCheckins.map((b: any, i: number) => (
                  <tr key={b.id} style={{ background: i % 2 === 0 ? "#fff" : "#f6f0f0", borderBottom: "1px solid #ddd", cursor: "pointer" }} onClick={() => navigate(`/bookings/${b.id}`)}>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={{ ...tdStyle, color: "#0066cc" }}>{b.booking_number}</td>
                    <td style={tdStyle}>{b.customer_name || "-"}</td>
                    <td style={tdStyle}>{b.contact_no || "-"}</td>
                    <td style={tdStyle}>{(b.adults || 0) + (b.children || 0)}</td>
                    <td style={tdStyle}>{b.check_out_date}</td>
                    <td style={tdStyle}>{b.agent?.name || "Direct"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #ccc" }}>
          <div style={{ background: "#c62828", color: "#fff", padding: "6px 12px", fontWeight: "bold", fontSize: 12, display: "flex", justifyContent: "space-between" }}>
            <span>Today's Check-Out</span>
            <span>{todayCheckouts.length} booking(s)</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#c47a7e", color: "#fff" }}>
                  <th style={thStyle}>S.No</th>
                  <th style={thStyle}>Booking</th>
                  <th style={thStyle}>Customer</th>
                  <th style={thStyle}>Contact</th>
                  <th style={thStyle}>Pax</th>
                  <th style={thStyle}>Check-in</th>
                  <th style={thStyle}>Agent</th>
                </tr>
              </thead>
              <tbody>
                {todayCheckouts.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: 16, textAlign: "center", color: "#999" }}>No check-outs today</td></tr>
                ) : todayCheckouts.map((b: any, i: number) => (
                  <tr key={b.id} style={{ background: i % 2 === 0 ? "#fff" : "#f6f0f0", borderBottom: "1px solid #ddd", cursor: "pointer" }} onClick={() => navigate(`/bookings/${b.id}`)}>
                    <td style={tdStyle}>{i + 1}</td>
                    <td style={{ ...tdStyle, color: "#0066cc" }}>{b.booking_number}</td>
                    <td style={tdStyle}>{b.customer_name || "-"}</td>
                    <td style={tdStyle}>{b.contact_no || "-"}</td>
                    <td style={tdStyle}>{(b.adults || 0) + (b.children || 0)}</td>
                    <td style={tdStyle}>{b.check_in_date}</td>
                    <td style={tdStyle}>{b.agent?.name || "Direct"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
