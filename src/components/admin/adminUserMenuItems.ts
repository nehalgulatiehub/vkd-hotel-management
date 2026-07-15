export interface AdminUserMenuItem {
  key: string;
  label: string;
}

export interface AdminUserMenuGroup {
  category: string;
  items: AdminUserMenuItem[];
}

export const ADMIN_USER_MENU_ITEMS: AdminUserMenuGroup[] = [
  { category: "Dashboard", items: [{ key: "dashboard", label: "Dashboard" }] },
  {
    category: "City Management",
    items: [
      { key: "cities_add", label: "Add City" },
      { key: "cities_view", label: "View City" },
      { key: "cities_export", label: "Export City" },
    ],
  },
  {
    category: "Agent Management",
    items: [
      { key: "agents_add", label: "Add Agent" },
      { key: "agents_view", label: "View Agent" },
      { key: "agents_export", label: "Export Agent" },
    ],
  },
  {
    category: "Transporter Management",
    items: [
      { key: "transporters_add", label: "Add Transporter" },
      { key: "transporters_view", label: "View Transporter" },
      { key: "transporters_export", label: "Export Transporter" },
    ],
  },
  {
    category: "Hotel Management",
    items: [
      { key: "own_hotels", label: "Own Hotels" },
      { key: "another_hotels_add", label: "Add Another Hotel" },
      { key: "another_hotels_view", label: "View Another Hotel" },
      { key: "another_hotels_export", label: "Export Another Hotel" },
    ],
  },
  {
    category: "Booking & Enquiry",
    items: [
      { key: "enquiries_add", label: "Generate Enquiry" },
      { key: "enquiries_view", label: "View Enquiry" },
      { key: "enquiries_export", label: "Export Enquiry" },
      { key: "bookings_availability", label: "Booking Availability" },
      { key: "bookings_hold_create", label: "Create Hold Booking" },
      { key: "bookings_hold_view", label: "View Hold Booking" },
      { key: "bookings_add", label: "Create Booking" },
      { key: "bookings_view", label: "View Booking" },
    ],
  },
  {
    category: "Booking Sections (Form Toggles)",
    items: [
      { key: "booking_section_booking", label: "Booking (Own Hotel)" },
      { key: "booking_section_delhi_manali", label: "Delhi - Manali" },
      { key: "booking_section_manali_delhi", label: "Manali - Delhi" },
      { key: "booking_section_safari", label: "Safari" },
      { key: "booking_section_another_hotel", label: "Another Hotel" },
      { key: "booking_section_vehicle", label: "Additional Vehicle" },
      { key: "booking_section_group_expenses", label: "Group Expenses" },
    ],
  },
  {
    category: "Room Manager",
    items: [
      { key: "room_manager_rooms", label: "Manage Rooms" },
      { key: "room_manager_room_bookings", label: "View Room Bookings" },
    ],
  },
  {
    category: "Booking Manager",
    items: [
      { key: "booking_manager_reference", label: "View Reference List" },
      { key: "booking_manager_view", label: "View Booking" },
      { key: "booking_manager_pending_payment", label: "View Pending Payment" },
      { key: "booking_manager_approved_payment", label: "View Approved Payment" },
      { key: "booking_manager_due_amount", label: "Due Amount" },
      { key: "booking_manager_total_pax", label: "Total Pax" },
    ],
  },
  {
    category: "Cancel Booking Manager",
    items: [
      { key: "cancel_booking_view", label: "View Cancel Booking" },
      { key: "cancel_booking_return_payment", label: "View Book Return Payment" },
      { key: "cancel_booking_charges", label: "View Cancellation Charge" },
    ],
  },
  {
    category: "Payment Manager",
    items: [
      { key: "payment_manager_refund", label: "View Refund Payment" },
      { key: "payment_manager_paid", label: "View Paid Payment" },
      { key: "payment_manager_receive", label: "View Receive Payment" },
    ],
  },
  {
    category: "Payment & Financials",
    items: [
      { key: "payments_view", label: "View Payment" },
      { key: "payments_booking_due", label: "Booking Due Amount" },
      { key: "payments_booking_view", label: "View Booking Payment" },
      { key: "payments_booking_export", label: "Export Booking" },
      { key: "payments_room_booking", label: "View Room Booking" },
      { key: "payments_safari", label: "View Safari Detail" },
      { key: "payments_safari_due", label: "Safari Due Amount" },
      { key: "payments_safari_payment", label: "View Safari Payment" },
      { key: "payments_volvo_dm", label: "Volvo Delhi - Manali Detail" },
      { key: "payments_dm_due", label: "Delhi - Manali Due Amount" },
      { key: "payments_volvo_md", label: "Volvo Manali - Delhi Detail" },
      { key: "payments_md_due", label: "Manali - Delhi Due Amount" },
      { key: "payments_volvo", label: "View Volvo Payment" },
      { key: "payments_hotel", label: "View Another Hotel Detail" },
      { key: "payments_hotel_due", label: "Another Hotel Due Amount" },
      { key: "payments_hotel_payment", label: "Another Hotel Payment" },
      { key: "payments_vehicle", label: "View Vehicle Detail" },
      { key: "payments_vehicle_due", label: "Vehicle Due Amount" },
      { key: "payments_vehicle_payment", label: "Another Vehicle Payment" },
    ],
  },
  {
    category: "Other Functions",
    items: [
      { key: "expenses", label: "View Group Expense" },
      { key: "bookings_cancelled", label: "View Cancel Booking" },
      { key: "refunds", label: "View Refund Payment" },
      { key: "refunds_cancelling", label: "View Cancelling Payment" },
      { key: "data_import", label: "Import Legacy Data" },
    ],
  },
  {
    category: "Restaurant",
    items: [
      { key: "restaurant_tables", label: "Tables" },
      { key: "restaurant_menu", label: "Food Menu" },
      { key: "restaurant_pos", label: "New Order (POS)" },
      { key: "restaurant_orders", label: "View Orders" },
      { key: "restaurant_reports", label: "Reports" },
    ],
  },
  {
    category: "Billing",
    items: [
      { key: "billing_create", label: "Create Invoice" },
      { key: "billing_invoices", label: "Saved Invoices" },
      { key: "billing_templates", label: "Invoice Templates" },
    ],
  },
  {
    category: "Quotation",
    items: [
      { key: "quotation_create", label: "Create Quotation" },
      { key: "quotation_list", label: "Saved Quotations" },
      { key: "quotation_templates", label: "Quotation Templates" },
    ],
  },
  {
    category: "Purchase Management",
    items: [
      { key: "purchase_vendors", label: "Vendors" },
      { key: "purchase_items", label: "Item Master" },
      { key: "purchase_requests", label: "Purchase Requests" },
      { key: "purchase_orders", label: "Purchase Orders" },
      { key: "purchase_grn", label: "Goods Receipt" },
      { key: "purchase_invoices", label: "Purchase Invoices" },
      { key: "purchase_inventory", label: "Inventory" },
      { key: "purchase_reports", label: "Reports" },
    ],
  },
  {
    category: "Account Panel (for Account role users)",
    items: [
      { key: "acc_booking_view", label: "Booking Manager - View Booking" },
      { key: "acc_room_booking_view", label: "Booking Manager - View Room Booking" },
      { key: "acc_pending_payment", label: "Booking Manager - View Pending Payment" },
      { key: "acc_approved_payment", label: "Booking Manager - View Approved Payment" },
      { key: "acc_due_amount", label: "Booking Manager - Due Amount" },
      { key: "acc_safari_details", label: "Safari - View Safari Detail" },
      { key: "acc_safari_pending", label: "Safari - View Pending Payment" },
      { key: "acc_safari_approved", label: "Safari - View Approved Payment" },
      { key: "acc_safari_due", label: "Safari - Due Amount" },
      { key: "acc_safari_money", label: "Safari Payment - Money Detail" },
      { key: "acc_safari_payment_add", label: "Safari Payment - Add Payment" },
      { key: "acc_safari_payment_view", label: "Safari Payment - View Payment" },
      { key: "acc_dm_volvo_details", label: "D-M Volvo - View Detail" },
      { key: "acc_dm_volvo_pending", label: "D-M Volvo - Pending Payment" },
      { key: "acc_dm_volvo_approved", label: "D-M Volvo - Approved Payment" },
      { key: "acc_dm_volvo_due", label: "D-M Volvo - Due Amount" },
      { key: "acc_md_volvo_details", label: "M-D Volvo - View Detail" },
      { key: "acc_md_volvo_pending", label: "M-D Volvo - Pending Payment" },
      { key: "acc_md_volvo_approved", label: "M-D Volvo - Approved Payment" },
      { key: "acc_md_volvo_due", label: "M-D Volvo - Due Amount" },
      { key: "acc_dm_transporter_money", label: "Transport Payment - D-M Money Detail" },
      { key: "acc_md_transporter_money", label: "Transport Payment - M-D Money Detail" },
      { key: "acc_transporter_payment_add", label: "Transport Payment - Add Payment" },
      { key: "acc_transporter_payment_view", label: "Transport Payment - View Payment" },
      { key: "acc_another_hotel_details", label: "Another Hotel - View Detail" },
      { key: "acc_another_hotel_pending", label: "Another Hotel - Pending Payment" },
      { key: "acc_another_hotel_approved", label: "Another Hotel - Approved Payment" },
      { key: "acc_another_hotel_due", label: "Another Hotel - Due Amount" },
      { key: "acc_another_hotel_money", label: "Another Hotel Payment - Money Detail" },
      { key: "acc_another_hotel_payment_add", label: "Another Hotel Payment - Add Payment" },
      { key: "acc_another_hotel_payment_view", label: "Another Hotel Payment - View Payment" },
      { key: "acc_vehicle_details", label: "Additional Vehicle - View Detail" },
      { key: "acc_vehicle_pending", label: "Additional Vehicle - Pending Payment" },
      { key: "acc_vehicle_approved", label: "Additional Vehicle - Approved Payment" },
      { key: "acc_vehicle_due", label: "Additional Vehicle - Due Amount" },
      { key: "acc_vehicle_transporter_money", label: "Vehicle Transport - Money Detail" },
      { key: "acc_vehicle_transporter_payment_add", label: "Vehicle Transport - Add Payment" },
      { key: "acc_vehicle_transporter_payment_view", label: "Vehicle Transport - View Payment" },
      { key: "acc_group_expenses", label: "Vehicle Transport - View Group Expense" },
      { key: "acc_book_return_payments", label: "Refund - Book Return Payment" },
      { key: "acc_paid_payments", label: "Refund - Paid Payment" },
      { key: "acc_receive_payments", label: "Refund - Receive Payment" },
    ],
  },
];
