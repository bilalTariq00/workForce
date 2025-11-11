# Manual QR Code Entry - What to Enter

## QR Code Data Format

The universal QR code contains this JSON data:

```json
{"type":"attendance","version":"1.0"}
```

## Manual Entry

If you need to enter the QR code manually (instead of scanning), you should enter:

```
{"type":"attendance","version":"1.0"}
```

## Where to Find This

1. **From the QR Display Page** (`/qr-display/public` or `/hr/qr-display`):
   - The QR code data is shown at the bottom of the page
   - You can copy it from there

2. **From the API**:
   - Call `/api/v1/qr/generate`
   - The response contains the `qrCode` field with the data

## Example

When you scan the QR code, it reads: `{"type":"attendance","version":"1.0"}`

So if you enter this manually in the input field, it will work the same way as scanning.

## Why Manual Entry?

Manual entry is useful when:
- Camera is not working
- QR code is damaged/unreadable
- You want to test the system
- Phone camera permission is denied

## Important Notes

- The QR code data is **case-sensitive**
- Must include the curly braces `{}`
- Must include quotes around keys and values
- Exact format: `{"type":"attendance","version":"1.0"}`

