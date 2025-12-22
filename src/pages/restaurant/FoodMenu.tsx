import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Leaf, AlertCircle, Database } from "lucide-react";

interface FoodCategory {
  id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

interface FoodItem {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  gst_percentage: number;
  hsn_code: string | null;
  is_available: boolean;
  is_vegetarian: boolean;
  food_categories?: FoodCategory;
}

const FoodMenu = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("items");
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<FoodCategory | null>(null);

  const [itemFormData, setItemFormData] = useState({
    name: "",
    category_id: "",
    description: "",
    price: "",
    is_available: true,
    is_vegetarian: true
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    display_order: "0"
  });

  const { data: categories } = useQuery({
    queryKey: ["food-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_categories")
        .select("*")
        .order("display_order");
      if (error) throw error;
      return data as FoodCategory[];
    }
  });

  const { data: items, isLoading } = useQuery({
    queryKey: ["food-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("food_items")
        .select("*, food_categories(*)")
        .order("name");
      if (error) throw error;
      return data as FoodItem[];
    }
  });

  const saveItemMutation = useMutation({
    mutationFn: async (data: typeof itemFormData) => {
      const itemData = {
        name: data.name,
        category_id: data.category_id || null,
        description: data.description || null,
        price: parseFloat(data.price),
        is_available: data.is_available,
        is_vegetarian: data.is_vegetarian
      };

      if (editingItem) {
        const { error } = await supabase.from("food_items").update(itemData).eq("id", editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("food_items").insert(itemData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-items"] });
      toast.success(editingItem ? "Item updated" : "Item added");
      resetItemForm();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const saveCategoryMutation = useMutation({
    mutationFn: async (data: typeof categoryFormData) => {
      const categoryData = {
        name: data.name,
        description: data.description || null,
        display_order: parseInt(data.display_order)
      };

      if (editingCategory) {
        const { error } = await supabase.from("food_categories").update(categoryData).eq("id", editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("food_categories").insert(categoryData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-categories"] });
      toast.success(editingCategory ? "Category updated" : "Category added");
      resetCategoryForm();
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("food_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-items"] });
      toast.success("Item deleted");
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("food_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-categories"] });
      toast.success("Category deleted");
    }
  });

  const resetItemForm = () => {
    setItemFormData({
      name: "", category_id: "", description: "", price: "",
      is_available: true, is_vegetarian: true
    });
    setEditingItem(null);
    setIsItemDialogOpen(false);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({ name: "", description: "", display_order: "0" });
    setEditingCategory(null);
    setIsCategoryDialogOpen(false);
  };

  const loadSampleDataMutation = useMutation({
    mutationFn: async () => {
      // Sample categories
      const categoriesData = [
        { name: "Starters", display_order: 1, description: "Appetizers and snacks" },
        { name: "Main Course", display_order: 2, description: "Main dishes" },
        { name: "Breads", display_order: 3, description: "Indian breads" },
        { name: "Rice & Biryani", display_order: 4, description: "Rice dishes" },
        { name: "Desserts", display_order: 5, description: "Sweet treats" },
        { name: "Beverages", display_order: 6, description: "Drinks" },
      ];

      const { data: insertedCategories, error: catError } = await supabase
        .from("food_categories")
        .insert(categoriesData)
        .select();
      
      if (catError) throw catError;

      const categoryMap: Record<string, string> = {};
      insertedCategories?.forEach(cat => {
        categoryMap[cat.name] = cat.id;
      });

      // Sample food items
      const foodItemsData = [
        // Starters
        { name: "Paneer Tikka", category_id: categoryMap["Starters"], price: 280, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        { name: "Chicken Tikka", category_id: categoryMap["Starters"], price: 320, gst_percentage: 5, is_vegetarian: false, hsn_code: "996331" },
        { name: "Veg Spring Roll", category_id: categoryMap["Starters"], price: 180, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        { name: "Tandoori Prawns", category_id: categoryMap["Starters"], price: 450, gst_percentage: 5, is_vegetarian: false, hsn_code: "996331" },
        { name: "Hara Bhara Kebab", category_id: categoryMap["Starters"], price: 220, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        // Main Course
        { name: "Butter Chicken", category_id: categoryMap["Main Course"], price: 380, gst_percentage: 5, is_vegetarian: false, hsn_code: "996331" },
        { name: "Paneer Butter Masala", category_id: categoryMap["Main Course"], price: 320, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        { name: "Dal Makhani", category_id: categoryMap["Main Course"], price: 260, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        { name: "Mutton Rogan Josh", category_id: categoryMap["Main Course"], price: 420, gst_percentage: 5, is_vegetarian: false, hsn_code: "996331" },
        { name: "Kadai Paneer", category_id: categoryMap["Main Course"], price: 300, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        { name: "Fish Curry", category_id: categoryMap["Main Course"], price: 350, gst_percentage: 5, is_vegetarian: false, hsn_code: "996331" },
        // Breads
        { name: "Butter Naan", category_id: categoryMap["Breads"], price: 60, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        { name: "Garlic Naan", category_id: categoryMap["Breads"], price: 70, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        { name: "Tandoori Roti", category_id: categoryMap["Breads"], price: 40, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        { name: "Laccha Paratha", category_id: categoryMap["Breads"], price: 65, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        // Rice & Biryani
        { name: "Steamed Rice", category_id: categoryMap["Rice & Biryani"], price: 120, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        { name: "Jeera Rice", category_id: categoryMap["Rice & Biryani"], price: 150, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        { name: "Veg Biryani", category_id: categoryMap["Rice & Biryani"], price: 280, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        { name: "Chicken Biryani", category_id: categoryMap["Rice & Biryani"], price: 350, gst_percentage: 5, is_vegetarian: false, hsn_code: "996331" },
        { name: "Mutton Biryani", category_id: categoryMap["Rice & Biryani"], price: 420, gst_percentage: 5, is_vegetarian: false, hsn_code: "996331" },
        // Desserts
        { name: "Gulab Jamun", category_id: categoryMap["Desserts"], price: 80, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        { name: "Rasmalai", category_id: categoryMap["Desserts"], price: 100, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        { name: "Ice Cream", category_id: categoryMap["Desserts"], price: 120, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        { name: "Brownie with Ice Cream", category_id: categoryMap["Desserts"], price: 180, gst_percentage: 5, is_vegetarian: true, hsn_code: "996331" },
        // Beverages
        { name: "Fresh Lime Soda", category_id: categoryMap["Beverages"], price: 60, gst_percentage: 18, is_vegetarian: true, hsn_code: "996332" },
        { name: "Mango Lassi", category_id: categoryMap["Beverages"], price: 90, gst_percentage: 18, is_vegetarian: true, hsn_code: "996332" },
        { name: "Masala Chai", category_id: categoryMap["Beverages"], price: 40, gst_percentage: 5, is_vegetarian: true, hsn_code: "996332" },
        { name: "Cold Coffee", category_id: categoryMap["Beverages"], price: 120, gst_percentage: 18, is_vegetarian: true, hsn_code: "996332" },
        { name: "Fresh Juice", category_id: categoryMap["Beverages"], price: 100, gst_percentage: 18, is_vegetarian: true, hsn_code: "996332" },
      ];

      const { error: itemsError } = await supabase.from("food_items").insert(foodItemsData);
      if (itemsError) throw itemsError;

      // Sample tables
      const tablesData = [
        { table_number: "T1", table_name: "Window Table", capacity: 4, status: "available" },
        { table_number: "T2", table_name: "Corner Booth", capacity: 6, status: "available" },
        { table_number: "T3", table_name: "Garden View", capacity: 4, status: "available" },
        { table_number: "T4", table_name: "Family Table", capacity: 8, status: "available" },
        { table_number: "T5", table_name: "Couple Table", capacity: 2, status: "available" },
        { table_number: "T6", table_name: "Bar Counter", capacity: 4, status: "available" },
        { table_number: "T7", table_name: "Private Dining", capacity: 10, status: "available" },
        { table_number: "T8", table_name: "Patio", capacity: 6, status: "available" },
      ];

      const { error: tablesError } = await supabase.from("restaurant_tables").insert(tablesData);
      if (tablesError) throw tablesError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["food-categories"] });
      queryClient.invalidateQueries({ queryKey: ["food-items"] });
      queryClient.invalidateQueries({ queryKey: ["restaurant-tables"] });
      toast.success("Sample data loaded successfully!");
    },
    onError: (error: Error) => toast.error(error.message)
  });

  const handleEditItem = (item: FoodItem) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      category_id: item.category_id || "",
      description: item.description || "",
      price: String(item.price),
      is_available: item.is_available,
      is_vegetarian: item.is_vegetarian
    });
    setIsItemDialogOpen(true);
  };

  const handleEditCategory = (category: FoodCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || "",
      display_order: String(category.display_order)
    });
    setIsCategoryDialogOpen(true);
  };

  if (isLoading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Food Menu</h1>
          <p className="text-muted-foreground">Manage food items and categories</p>
        </div>
        {(!items || items.length === 0) && (!categories || categories.length === 0) && (
          <Button 
            variant="outline" 
            onClick={() => loadSampleDataMutation.mutate()}
            disabled={loadSampleDataMutation.isPending}
          >
            <Database className="h-4 w-4 mr-2" />
            {loadSampleDataMutation.isPending ? "Loading..." : "Load Sample Data"}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items">Food Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetItemForm(); setIsItemDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Food Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit Food Item" : "Add Food Item"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); saveItemMutation.mutate(itemFormData); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Food Name <span className="text-destructive">*</span></Label>
                    <Input
                      required
                      placeholder="e.g., Butter Chicken"
                      value={itemFormData.name}
                      onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select value={itemFormData.category_id} onValueChange={(v) => setItemFormData({ ...itemFormData, category_id: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories?.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Price (₹) <span className="text-destructive">*</span></Label>
                      <Input
                        type="number"
                        required
                        step="0.01"
                        placeholder="e.g., 350"
                        value={itemFormData.price}
                        onChange={(e) => setItemFormData({ ...itemFormData, price: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Item description..."
                      value={itemFormData.description}
                      onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={itemFormData.is_vegetarian}
                        onCheckedChange={(v) => setItemFormData({ ...itemFormData, is_vegetarian: v })}
                      />
                      <Label>Vegetarian</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={itemFormData.is_available}
                        onCheckedChange={(v) => setItemFormData({ ...itemFormData, is_available: v })}
                      />
                      <Label>Available</Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={resetItemForm}>Cancel</Button>
                    <Button type="submit" disabled={saveItemMutation.isPending}>Save</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items?.map((item) => (
              <Card key={item.id} className={!item.is_available ? "opacity-60" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {item.is_vegetarian ? (
                        <Leaf className="h-4 w-4 text-success" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <CardTitle className="text-lg">{item.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEditItem(item)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteItemMutation.mutate(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {item.food_categories && (
                    <Badge variant="secondary">{item.food_categories.name}</Badge>
                  )}
                  <p className="text-xl font-bold text-primary">₹{item.price.toLocaleString("en-IN")}</p>
                  {!item.is_available && <Badge variant="destructive">Out of Stock</Badge>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { resetCategoryForm(); setIsCategoryDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => { e.preventDefault(); saveCategoryMutation.mutate(categoryFormData); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Category Name <span className="text-destructive">*</span></Label>
                    <Input
                      required
                      placeholder="e.g., Main Course"
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={categoryFormData.display_order}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, display_order: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="Category description..."
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={resetCategoryForm}>Cancel</Button>
                    <Button type="submit" disabled={saveCategoryMutation.isPending}>Save</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories?.map((cat) => (
              <Card key={cat.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{cat.name}</CardTitle>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleEditCategory(cat)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteCategoryMutation.mutate(cat.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Order: {cat.display_order}</p>
                  {cat.description && <p className="text-sm mt-1">{cat.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FoodMenu;
