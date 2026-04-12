#!/usr/bin/env python3
"""
Fix broken UTF-8 characters in app/app/page.tsx
"""
import sys

file_path = 'app/app/page.tsx'

# Read the file with UTF-8 encoding
with open(file_path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# Dictionary of replacements
replacements = {
    # Wave emoji - handle various corrupted forms
    'Welcome back ðŸ\'‹': 'Welcome back 👋',
    'Welcome back ðŸ\'‹\n': 'Welcome back 👋\n',
    
    # Transaction toast message - broken bytes
    'toast.success(`â‚¦${(data.amount || 0).toLocaleString()} â€\" ${selectedPlan.sizeLabel} sent to ${phone} âœ`);': 
    'toast.success(`₦${(data.amount || 0).toLocaleString()} – ${selectedPlan.sizeLabel} sent to ${phone} ✓`);',
}

# Apply replacements
original_content = content
for old, new in replacements.items():
    content = content.replace(old, new)

# Check if any replacements were made
if content != original_content:
    # Write back with UTF-8 encoding
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✓ Fixed broken UTF-8 characters in {file_path}")
    
    # Count replacements
    count = (len(original_content) - len(content.encode('utf-8'))) // 10
    print(f"  Total issues fixed")
else:
    print(f"⚠ No broken characters found to fix")

sys.exit(0)
