# services/ and controllers/

Both are split by **who can call them**, with the same folder names:

| Folder    | Who                              |
|-----------|----------------------------------|
| `public/` | anyone, no login                 |
| `user/`   | any logged-in user               |
| `seller/` | store owners (`SELLER`)          |
| `admin/`  | administration panel (`ADMIN`)   |
| `shared/` | code used by more than one role  |

A file never imports another role's folder — only `shared/`.
