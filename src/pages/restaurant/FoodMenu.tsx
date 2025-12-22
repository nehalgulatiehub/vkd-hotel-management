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
import { Plus, Edit, Trash2, Leaf, AlertCircle } from "lucide-react";

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
    gst_percentage: "5",
    hsn_code: "",
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
        gst_percentage: parseFloat(data.gst_percentage),
        hsn_code: data.hsn_code || null,
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
      gst_percentage: "5", hsn_code: "", is_available: true, is_vegetarian: true
    });
    setEditingItem(null);
    setIsItemDialogOpen(false);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({ name: "", description: "", display_order: "0" });
    setEditingCategory(null);
    setIsCategoryDialogOpen(false);
  };

  const handleEditItem = (item: FoodItem) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      category_id: item.category_id || "",
      description: item.description || "",
      price: String(item.price),
      gst_percentage: String(item.gst_percentage),
      hsn_code: item.hsn_code || "",
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>GST %</Label>
                      <Select value={itemFormData.gst_percentage} onValueChange={(v) => setItemFormData({ ...itemFormData, gst_percentage: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0%</SelectItem>
                          <SelectItem value="5">5%</SelectItem>
                          <SelectItem value="12">12%</SelectItem>
                          <SelectItem value="18">18%</SelectItem>
                          <SelectItem value="28">28%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>HSN Code</Label>
                      <Input
                        placeholder="e.g., 996331"
                        value={itemFormData.hsn_code}
                        onChange={(e) => setItemFormData({ ...itemFormData, hsn_code: e.target.value })}
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
                  <p className="text-sm text-muted-foreground">GST: {item.gst_percentage}%</p>
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
