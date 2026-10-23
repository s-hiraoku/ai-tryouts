# fixture-library

A small Node library a host process calls. There is no server in this directory.

The host passes a `request` object. Values under `request.query` come from the host's caller. This library does not trust them.

`db.query` sends its first argument to a SQL engine. When a second argument is present, that array is the bound parameter list.

`readUserFile` reads a file under `data/user-files`. `readPublicDoc` reads a named file under `data/public`. `authorizationHeader` builds a header string for the host to send.
