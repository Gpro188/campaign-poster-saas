# Text Drag & Drop Fix + Field Customization

## ✅ Issues Fixed

### 1. Text Dragging Not Working
**Problem**: Could not drag text elements on the canvas when creating a campaign.

**Root Cause**: 
- Hit detection was using circular distance calculation instead of bounding box
- Canvas scaling factors weren't properly calculated
- Missing `preventDefault()` on mousedown

**Solution**:
- ✅ Changed to **bounding box detection** for more accurate clicking
- ✅ Added proper **canvas scale calculations** (scaleX, scaleY)
- ✅ Added `e.preventDefault()` to prevent browser drag behavior
- ✅ Only checks **enabled text fields** for dragging

**Code Changes** in `client/app/admin/create-campaign/page.tsx`:
```typescript
// Before: Circular distance check (inaccurate)
const clickedField = textPositions.find((pos) => {
  const dx = pos.x - x;
  const dy = pos.y - y;
  return Math.sqrt(dx * dx + dy * dy) < 30;
});

// After: Bounding box check (accurate)
const clickedField = enabledPositions.find((pos) => {
  const fontSize = pos.fontSize || 48;
  const metrics = ctx.measureText(pos.label);
  const textWidth = metrics.width;
  
  return (
    x >= pos.x - 5 &&
    x <= pos.x + textWidth + 5 &&
    y >= pos.y - fontSize &&
    y <= pos.y + 10
  );
});
```

---

### 2. Text Field Customization
**Request**: Some campaigns only need name field, not designation or location.

**Solution**: Added **Show/Hide toggle** for each text field.

**Features**:
- ✅ Checkbox to enable/disable each text field
- ✅ Disabled fields are grayed out visually
- ✅ Only enabled fields are drawn on canvas
- ✅ Only enabled fields are saved to database
- ✅ Fields can be toggled on/off anytime

**UI Changes**:
```tsx
// New checkbox for each field
<label className="flex items-center gap-2 cursor-pointer">
  <input
    type="checkbox"
    checked={pos.enabled !== false}
    onChange={(e) => {
      setTextPositions((prev) =>
        prev.map((p) =>
          p.field === pos.field ? { ...p, enabled: e.target.checked } : p
        )
      );
    }}
    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
  />
  <span className="text-xs text-gray-600">Show</span>
</label>
```

---

## 🎯 How to Use

### Create Campaign with Custom Fields:

1. Go to **Admin Dashboard** → **Create Campaign**
2. Upload your frame image
3. In the **Position Text Elements** section, you'll see 3 cards:
   - Name
   - Designation  
   - Location

4. **Uncheck "Show"** for fields you don't need:
   - ✅ Want only name? → Uncheck Designation and Location
   - ✅ Want name + location? → Uncheck Designation only
   - ✅ Want all three? → Keep all checked (default)

5. **Drag text boxes** to position them on the canvas:
   - Click directly on the red-bordered text
   - Drag to desired position
   - Release to drop

6. Adjust font size and color if needed
7. Click **"Create Campaign"**

---

## 🔧 Technical Details

### Interface Update:
```typescript
interface DraggableText {
  field: 'name' | 'designation' | 'location';
  label: string;
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  isBold?: boolean;
  enabled?: boolean;  // ← NEW property
}
```

### Default State:
```typescript
[
  { field: 'name', label: 'Name', enabled: true },
  { field: 'designation', label: 'Designation', enabled: true },
  { field: 'location', label: 'Location', enabled: true },
]
```

### Canvas Drawing:
```typescript
// Only draw enabled fields
const enabledPositions = textPositions.filter(pos => pos.enabled !== false);
enabledPositions.forEach((pos) => {
  // Draw text and bounding box
});
```

### Form Submission:
```typescript
// Only save enabled positions
textPositions
  .filter(pos => pos.enabled !== false)
  .map(({ field, x, y, fontSize, color, isBold }) => ({
    field, x, y, fontSize, color, isBold
  }))
```

---

## 📊 Use Cases

### Campaign Type: Name Only
**Example**: Simple signature campaign
- ✅ Show: Name
- ❌ Hide: Designation, Location

### Campaign Type: Name + Location
**Example**: Geographic support mapping
- ✅ Show: Name, Location
- ❌ Hide: Designation

### Campaign Type: Full Details
**Example**: Political campaign with titles
- ✅ Show: Name, Designation, Location
- ❌ Hide: None

---

## 🎨 Visual Feedback

### Enabled Field Card:
```
┌─────────────────────┐
│ 👤 Name       [✓]   │ ← Blue text, white background
│ Position: X   Y     │
│ Size: 48   Color    │
└─────────────────────┘
```

### Disabled Field Card:
```
┌─────────────────────┐
│ 👤 Name       [ ]   │ ← Gray text, gray background
│ Position: X   Y     │
│ Size: 48   Color    │
└─────────────────────┘
```

---

## ✅ Testing Checklist

- [x] Can drag text by clicking on it
- [x] Text snaps to cursor position
- [x] Works with different canvas sizes
- [x] Checkbox toggles field visibility
- [x] Disabled fields don't appear on canvas
- [x] Only enabled fields are saved
- [x] Can re-enable fields later
- [x] Multiple fields can be enabled/disabled

---

## 🚀 Benefits

1. **Flexibility**: Customize campaigns per client needs
2. **Simplicity**: Clean UI for non-technical users
3. **Accuracy**: Improved drag detection
4. **Performance**: Only processes enabled fields
5. **UX**: Clear visual feedback on field state

---

## 💡 Future Enhancements (Optional)

- Add more field types (email, phone, custom message)
- Save field templates for reuse
- Bulk enable/disable buttons
- Field ordering (drag to reorder)
- Preset positions (top-left, center, etc.)

---

**Both issues are now completely fixed!** 🎉

You can now:
1. ✅ Drag text accurately on the canvas
2. ✅ Choose which text fields to include in each campaign
