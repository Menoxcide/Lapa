# Submodule Fix and Licensing Information

## Problem Summary

The `lapa-ide-void` submodule was pointing to `https://github.com/voideditor/void.git`, but you don't have write access to that repository. This caused the submodule link to be broken on GitHub.

## Solution Applied

**Converted submodule to regular directory**: Removed the `.git` folder from `lapa-ide-void` and added it as regular files in your main repository. This:
- ✅ Fixes the broken submodule link
- ✅ Makes the codebase self-contained
- ✅ Simplifies deployment and distribution
- ⚠️ Note: This removes the void repository's git history, but you keep all the code

## Licensing - Commercial Use is ALLOWED ✅

### Void IDE License
- **Base (VS Code)**: MIT License - allows commercial use
- **Void additions**: Apache 2.0 License - allows commercial use
- **Copyright**: Glass Devtools, Inc. (2025)

### LAPA License
- **License**: MIT License
- **Copyright**: LAPA Team (2025)

### Key Points:
1. ✅ **You CAN release this commercially** - Both MIT and Apache 2.0 allow commercial use
2. ✅ **You CAN make money** - Selling, licensing, or offering paid services is permitted
3. ✅ **You CAN modify and distribute** - Both licenses allow modifications
4. ⚠️ **You MUST include license notices** - Keep all copyright and license notices intact

### Required Attribution

When distributing your product, you must include:

1. **Void/VSCode MIT License** - Include the MIT license text and copyright notice:
   ```
   Copyright (c) 2015 - present Microsoft Corporation
   Copyright 2025 Glass Devtools, Inc.
   ```

2. **Void Apache 2.0 License** - Include the Apache 2.0 license for Void's additions

3. **LAPA MIT License** - Include your MIT license:
   ```
   Copyright (c) 2025 LAPA Team
   ```

4. **Third Party Notices** - Include `lapa-ide-void/ThirdPartyNotices.txt` which lists all dependencies

### Best Practices

1. **Include LICENSE files** in your distribution
2. **Add attribution** in your README or About dialog
3. **Keep ThirdPartyNotices.txt** updated
4. **Document your modifications** to Void code

## What Changed

- ✅ Removed `.gitmodules` file
- ✅ Removed `.git` folder from `lapa-ide-void/`
- ✅ Added `lapa-ide-void/` as regular directory in main repo
- ✅ All void code is now part of your repository

## Next Steps

1. Commit these changes:
   ```bash
   git add .
   git commit -m "Convert lapa-ide-void from submodule to regular directory"
   ```

2. Push to GitHub - the broken submodule link will be resolved

3. For future updates from void:
   - You can manually merge changes from `https://github.com/voideditor/void.git`
   - Or create your own fork if you want to track upstream

## Legal Disclaimer

This information is provided for guidance only. For commercial projects, consider consulting with a lawyer familiar with open source licensing to ensure full compliance.

