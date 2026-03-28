import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay } from "date-fns";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, Area, AreaChart
} from "recharts";

const COLORS = ["#b44a50", "#c47a7e", "#d4a59a", "#e8c8c0", "#4a90b4", "#6ab04c", "#f0932b", "#eb4d4b"];

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
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchBookingTrend(), fetchRecentBookings()]);
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

    // Payment status pie
    setPaymentStatusData([
      { name: "Pending", value: pending, color: "#f0932b" },
      { name: "Approved", value: approved, color: "#6ab04c" },
      { name: "Rejected", value: payments.filter(p => p.approval_status === "rejected").length, color: "#eb4d4b" },
    ].filter(d => d.value > 0));

    // Revenue by payment type
    const typeMap: Record<string, number> = {};
    payments.filter(p => p.approval_status === "approved").forEach(p => {
      const t = p.payment_type || "other";
      typeMap[t] = (typeMap[t] || 0) + (p.amount || 0);
    });
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

  const formatCurrency = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  if (loading) return <div style={{ padding: 40, textAlign: "center", fontFamily: "Arial", fontSize: 13, color: "#999" }}>Loading dashboard...</div>;

  return (
    <div style={{ padding: 16, fontFamily: "Arial, Helvetica, sans-serif", fontSize: 12 }}>
      {/* Welcome Banner */}
      <div style={{
        background: "linear-gradient(135deg, #b44a50 0%, #8b3a3e 100%)",
        borderRadius: 8, padding: "20px 24px", marginBottom: 16, color: "#fff",
        display: "flex", justifyContent: "space-between", alignItems: "center"
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: "bold" }}>Welcome to Admin Dashboard</h1>
          <p style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.9 }}>{format(new Date(), "EEEE, dd MMMM yyyy")}</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "8px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: "bold" }}>{stats.todayBookings}</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Today's Bookings</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 6, padding: "8px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: "bold" }}>{formatCurrency(stats.monthRevenue)}</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>This Month Revenue</div>
          </div>
        </div>
      </div>

      {/* Stat Cards Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Total Bookings", value: stats.totalBookings, sub: `${stats.confirmedBookings} confirmed`, color: "#b44a50", icon: "📅" },
          { label: "Total Revenue", value: formatCurrency(stats.totalRevenue), sub: `Paid: ${formatCurrency(stats.totalPaid)}`, color: "#4a90b4", icon: "💰" },
          { label: "Due Amount", value: formatCurrency(stats.totalDue), sub: "Outstanding balance", color: "#f0932b", icon: "⚠️" },
          { label: "Pending Payments", value: stats.pendingPayments, sub: `${stats.approvedPayments} approved`, color: "#6ab04c", icon: "⏳" },
        ].map((card, i) => (
          <div key={i} style={{
            border: "1px solid #e0e0e0", borderRadius: 6, padding: 16, backgroundColor: "#fff",
            borderLeft: `4px solid ${card.color}`, position: "relative", overflow: "hidden"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 4, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 }}>{card.label}</div>
                <div style={{ fontSize: 22, fontWeight: "bold", color: "#333" }}>{card.value}</div>
                <div style={{ fontSize: 10, color: "#999", marginTop: 4 }}>{card.sub}</div>
              </div>
              <span style={{ fontSize: 28, opacity: 0.3 }}>{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Stat Cards Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { label: "Users", value: stats.totalUsers, color: "#9b59b6", icon: "👥", link: "/admin/users" },
          { label: "Agents", value: stats.totalAgents, color: "#3498db", icon: "🤝", link: "/admin/agents" },
          { label: "Hotels", value: stats.totalHotels, color: "#e67e22", icon: "🏨", link: "/admin/manage-hotels" },
          { label: "Transporters", value: stats.totalTransporters, color: "#27ae60", icon: "🚗", link: "/admin/transporters" },
        ].map((card, i) => (
          <div key={i} onClick={() => navigate(card.link)} style={{
            border: "1px solid #e0e0e0", borderRadius: 6, padding: "12px 16px", backgroundColor: "#fff",
            borderTop: `3px solid ${card.color}`, cursor: "pointer", transition: "box-shadow 0.2s"
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 10, color: "#888", fontWeight: "bold", textTransform: "uppercase" }}>{card.label}</div>
                <div style={{ fontSize: 20, fontWeight: "bold", color: "#333" }}>{card.value}</div>
              </div>
              <span style={{ fontSize: 24, opacity: 0.4 }}>{card.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12, marginBottom: 16 }}>
        {/* Booking Trend */}
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 16, backgroundColor: "#fff" }}>
          <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 12, color: "#333" }}>📈 Booking Trend (Last 30 Days)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={bookingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} />
              <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="bookings" stroke="#b44a50" fill="#b44a50" fillOpacity={0.15} strokeWidth={2} name="Bookings" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Status Pie */}
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 16, backgroundColor: "#fff" }}>
          <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 12, color: "#333" }}>🥧 Payment Status</div>
          {paymentStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={paymentStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {paymentStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ textAlign: "center", padding: 40, color: "#999" }}>No payment data</div>}
        </div>
      </div>

      {/* Revenue Chart + Booking Status */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        {/* Revenue Trend */}
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 16, backgroundColor: "#fff" }}>
          <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 12, color: "#333" }}>💰 Revenue Trend (Last 30 Days)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={bookingTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 9 }} interval={4} />
              <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ fontSize: 11 }} formatter={(v: number) => [`₹${v.toLocaleString()}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#4a90b4" radius={[3, 3, 0, 0]} name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Booking Status Breakdown */}
        <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, padding: 16, backgroundColor: "#fff" }}>
          <div style={{ fontSize: 13, fontWeight: "bold", marginBottom: 12, color: "#333" }}>📊 Booking Status</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { label: "Confirmed", count: stats.confirmedBookings, total: stats.totalBookings, color: "#6ab04c" },
              { label: "Cancelled", count: stats.cancelledBookings, total: stats.totalBookings, color: "#eb4d4b" },
              { label: "On Hold", count: stats.holdBookings, total: stats.totalBookings, color: "#f0932b" },
            ].map((item, i) => {
              const pct = stats.totalBookings > 0 ? (item.count / stats.totalBookings) * 100 : 0;
              return (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, fontSize: 11 }}>
                    <span style={{ fontWeight: "bold" }}>{item.label}</span>
                    <span>{item.count} ({pct.toFixed(1)}%)</span>
                  </div>
                  <div style={{ height: 8, backgroundColor: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, backgroundColor: item.color, borderRadius: 4, transition: "width 0.5s" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 16, padding: "10px 12px", backgroundColor: "#f9f5f5", borderRadius: 4, border: "1px solid #eee" }}>
            <div style={{ fontSize: 11, fontWeight: "bold", color: "#333", marginBottom: 6 }}>💵 Financial Summary</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 11 }}>
              <span style={{ color: "#666" }}>Total Revenue:</span><span style={{ fontWeight: "bold", textAlign: "right" }}>{formatCurrency(stats.totalRevenue)}</span>
              <span style={{ color: "#666" }}>Total Collected:</span><span style={{ fontWeight: "bold", textAlign: "right", color: "#6ab04c" }}>{formatCurrency(stats.totalPaid)}</span>
              <span style={{ color: "#666" }}>Outstanding Due:</span><span style={{ fontWeight: "bold", textAlign: "right", color: "#eb4d4b" }}>{formatCurrency(stats.totalDue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Bookings Table */}
      <div style={{ border: "1px solid #e0e0e0", borderRadius: 6, overflow: "hidden", backgroundColor: "#fff" }}>
        <div style={{
          backgroundColor: "#b44a50", color: "#fff", padding: "8px 16px", fontSize: 13, fontWeight: "bold",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span>📋 Recent Bookings</span>
          <span onClick={() => navigate("/admin/bookings")} style={{ fontSize: 11, cursor: "pointer", textDecoration: "underline" }}>View All</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ backgroundColor: "#c47a7e", color: "#fff" }}>
              {["S.No", "Booking No", "Customer", "Amount", "Status", "Date"].map(h => (
                <th key={h} style={{ border: "1px solid #a88", padding: "5px 8px", textAlign: "left", fontWeight: "bold" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentBookings.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", padding: 20, color: "#999" }}>No bookings found</td></tr>
            ) : recentBookings.map((b, i) => (
              <tr key={b.id} style={{ backgroundColor: i % 2 === 0 ? "#fff" : "#f6f0f0", cursor: "pointer" }}
                onClick={() => navigate(`/admin/bookings/${b.id}`)}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#ece4e4")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = i % 2 === 0 ? "#fff" : "#f6f0f0")}>
                <td style={{ border: "1px solid #ddd", padding: "5px 8px", color: "#606060" }}>{i + 1}</td>
                <td style={{ border: "1px solid #ddd", padding: "5px 8px", color: "#0066cc", fontWeight: "bold" }}>{b.booking_number}</td>
                <td style={{ border: "1px solid #ddd", padding: "5px 8px", color: "#606060" }}>{b.customer_name || "-"}</td>
                <td style={{ border: "1px solid #ddd", padding: "5px 8px", color: "#606060" }}>{formatCurrency(b.total_amount || 0)}</td>
                <td style={{ border: "1px solid #ddd", padding: "5px 8px" }}>
                  <span style={{
                    padding: "1px 6px", borderRadius: 3, fontSize: 10, fontWeight: "bold",
                    backgroundColor: b.status === "confirmed" ? "#d4edda" : b.status === "cancelled" ? "#f8d7da" : "#fff3cd",
                    color: b.status === "confirmed" ? "#155724" : b.status === "cancelled" ? "#721c24" : "#856404",
                  }}>{b.status || "N/A"}</span>
                </td>
                <td style={{ border: "1px solid #ddd", padding: "5px 8px", color: "#606060" }}>{b.created_at ? format(new Date(b.created_at), "dd-MMM-yyyy") : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
