# Dynamic Form Fields Feature

## ✅ What's New

The form fields in **Step 3 (Enter Your Information)** are now **completely dynamic** based on what the admin configures when creating/editing a campaign.

---

## 🎯 How It Works

### For Campaign Owners (Admin)

When creating or editing a campaign, you can now:

1. **Enable/Disable Fields** - Use the "Show" checkbox for each field
2. **Custom Labels** - Change what users see (e.g., "Student Name" instead of "Name")
3. **Configure Per Campaign** - Each campaign can have different fields

#### Example Configurations:

**Simple Campaign (Name Only):**
- ✅ Name: "Member Name" (enabled)
- ❌ Designation (disabled)
- ❌ Location (disabled)

**Institution Campaign:**
- ✅ Name: "Student Name" (enabled)
- ✅ Designation: "Department" (enabled)
- ❌ Location (disabled)

**Full Campaign:**
- ✅ Name: "Supporter Name" (enabled)
- ✅ Designation: "Role/Position" (enabled)
- ✅ Location: "City/Branch" (enabled)

---

### For Users (Supporters)

Users will **only see the fields you enabled**:

#### If Admin Enabled Only Name:
```
Enter Your Information
┌─────────────────────┐
│ Student Name *      │
│ [_______________]   │
└─────────────────────┘
[Submit & Generate Poster]
```

#### If Admin Enabled All Fields:
```
Enter Your Information
┌─────────────────────┐
│ Student Name *      │
│ [_______________]   │
│                     │
│ Department          │
│ [_______________]   │
│                     │
│ City/Branch         │
│ [_______________]   │
└─────────────────────┘
[Submit & Generate Poster]
```

---

## 🔧 Admin Interface

### In Create/Edit Campaign Page:

Each text field now has:

1. **Field Label Input** - Custom name for the field
   - Examples: "Student Name", "Institution", "Branch", "Role"
   
2. **Show Checkbox** - Enable/disable this field
   - ✅ Checked = Users will see this field
   - ❌ Unchecked = Field hidden from users

3. **Position Controls** - X, Y coordinates on the poster

4. **Styling** - Font size and color

### Screenshot Guide:

```
┌─────────────────────────────────────┐
│ Name                                │
│ ┌───────────────────────┐  ☑ Show  │
│ │ Field Label:          │          │
│ │ [Student Name     ]   │          │
│ └───────────────────────┘          │
│                                    │
│ Position: [X: 100] [Y: 100]       │
│ Size: [48]  Color: [#FFFFFF]      │
└─────────────────────────────────────┘
```

---

## 💡 Use Cases

### 1. **School/College Campaign**
- Name: "Student Name"
- Designation: "Class/Department"
- Location: "Campus" (optional)

### 2. **Corporate Campaign**
- Name: "Employee Name"
- Designation: "Department/Team"
- Location: "Office Location"

### 3. **Simple Membership**
- Name: "Member Name" (only field enabled)
- Designation: (disabled)
- Location: (disabled)

### 4. **Event Registration**
- Name: "Attendee Name"
- Designation: "Organization"
- Location: "City"

---

## 🎨 Technical Details

### Changes Made:

1. **TypeScript Types** (`client/src/types/index.ts`)
   - Added `label?: string` to TextPosition
   - Added `enabled?: boolean` to TextPosition

2. **Campaign Page** (`client/app/campaigns/[id]/page.tsx`)
   - Dynamic form rendering based on `campaign.textPositions`
   - Filters out disabled fields (`pos.enabled !== false`)
   - Uses custom labels from admin configuration
   - Validation checks if name field is enabled

3. **Admin Create Page** (`client/app/admin/create-campaign/page.tsx`)
   - Added "Field Label" input for each text position
   - Shows placeholder examples based on field type

4. **Admin Edit Page** (`client/app/admin/edit-campaign/[id]/page.tsx`)
   - Loads saved labels and enabled status from database
   - Added "Field Label" input for editing

---

## 📊 Data Flow

### Admin Creates Campaign:
```
Admin sets label: "Student Name"
Admin enables: ✅ Name, ✅ Designation, ❌ Location
         ↓
Saved to MongoDB:
{
  textPositions: [
    { field: 'name', label: 'Student Name', enabled: true, ... },
    { field: 'designation', label: 'Department', enabled: true, ... },
    { field: 'location', label: 'Location', enabled: false, ... }
  ]
}
```

### User Fills Form:
```
Campaign loaded → Filter enabled fields
         ↓
Show only:
- Student Name * (required)
- Department (optional)
         ↓
User fills and submits
```

---

## ✨ Benefits

1. **Flexibility** - Each campaign can have different fields
2. **User-Friendly** - Custom labels make forms clearer
3. **Simple Forms** - Hide unnecessary fields
4. **Context-Specific** - Labels match your use case
5. **Backward Compatible** - Works with existing campaigns

---

## 🧪 Testing Checklist

### As Admin:
- [ ] Create campaign with only Name enabled
- [ ] Create campaign with custom labels
- [ ] Edit existing campaign and disable fields
- [ ] Change labels and verify they save

### As User:
- [ ] Fill campaign with only Name field
- [ ] Fill campaign with all fields enabled
- [ ] Verify custom labels appear correctly
- [ ] Submit and check poster shows correct data

---

## 🔄 Migration Notes

**Existing Campaigns:**
- Old campaigns without `label` will use defaults (Name, Designation, Location)
- Old campaigns without `enabled` field will show all fields (backward compatible)
- No database migration needed!

---

## 🎯 Summary

✅ **Admins can customize** what fields users see  
✅ **Custom labels** for better context  
✅ **Enable/disable** fields per campaign  
✅ **Dynamic rendering** - form adapts automatically  
✅ **Clean UX** - users only see relevant fields  

**The form now adapts to YOUR needs!** 🎉
