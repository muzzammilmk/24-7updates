# 24/7Updates.com — Website Starter

A responsive Hausa-first news website with:
- Automatic headlines fetched from public RSS feeds (when the feed sources are available).
- Categories: Duniya, Najeriya, Wasanni, Nishaɗi, Fasaha, Kasuwanci, Barkwanci.
- Search, source links, responsive mobile layout.
- Admin login and a form to publish/delete your own posts.
- Manual posts are saved server-side in `data/posts.json`.

## Important before going live
This is a deployable starter project, not a website already published at `24-7updates.com`. You must register the domain (if available), deploy the app to a Node.js host, and connect the domain. The domain name may already be owned by someone else; verify availability with a registrar.

## Run locally
1. Install Node.js 18 or newer.
2. Unzip the project and open a terminal in this folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Set a long random `SESSION_SECRET` and a strong `ADMIN_PASSWORD` in `.env`. Never deploy with the example/default values.
6. Run `npm start`.
7. Open `http://localhost:3000`.

## Deploying
Deploy to a Node.js host that supports a persistent disk/volume, because manually published stories are saved in `data/posts.json`. Add the environment variables from `.env.example` in the host dashboard. Do not upload `.env` or publish your admin password. For a domain, buy/register it from a domain registrar and follow the hosting provider's instructions for connecting DNS.

## Automatic news feeds
Current RSS feeds are configured in `server.js`:
- Al Jazeera — world news
- BBC Sport — sports
- ESPN — sports
- The Verge — technology
- The Guardian Culture — culture/entertainment

Feeds can change or become unavailable. Automatic items link to their original publisher. The site shows headlines and short snippets, not copied full articles. Review feed terms and update the source list as needed. RSS sources are currently mostly English; add reliable Hausa/Nigerian RSS sources if you want more Hausa-language automatic content.

## Admin
Click **Shafin Admin / Saka Labari** in the footer. Login using `ADMIN_PASSWORD`. You can publish stories with a category, text, optional image URL and optional source link. Use HTTPS in production. For a larger production site, consider a database, rate limiting, backups, stronger session storage, and image uploads rather than external image URLs.
