# 🚀 Getting started with Strapi

## Automated social publishing

Publishing an article automatically creates a linked Social Post for Facebook and Instagram and dispatches it. An existing Social Post linked to that article prevents an automatic duplicate. Instagram requires a public image URL; if the article has no usable image or a platform API rejects the request, the Social Post records the error and is marked failed. For manual posts or retries, create a Social Post and set its status to `ready_to_post`. A custom media upload takes precedence over the article image.

Set these environment variables before enabling publishing:

- `FB_PAGE_ID` and `FB_PAGE_ACCESS_TOKEN`
- `IG_USER_ID` and `FB_PAGE_ACCESS_TOKEN`
- `LINKEDIN_ORG_ID` and `LINKEDIN_ACCESS_TOKEN`
- `FRONTEND_PUBLIC_URL`, `STRAPI_URL`, and `PUBLIC_MEDIA_URL` (when media is stored behind a public CDN)
- `SOCIAL_FRAME_PATH` (optional absolute path to a transparent PNG; when set, artwork is cropped to 1080x1350, composited with the frame and title, then uploaded to the configured Strapi media provider)

Keep API credentials in the deployment environment, not in source control. The renderer uses `sharp`; install the Strapi-compatible range with `npm install sharp@^0.34.5`.

For future scheduling, leave the Social Post as a draft and use a Strapi API token with permission to dispatch Social Posts. Configure a cron entry to call the endpoint at the desired time:

```sh
0 9 * * * curl --fail -X POST "$STRAPI_URL/api/social-posts/$SOCIAL_POST_ID/dispatch" \
	-H "Authorization: Bearer $STRAPI_API_TOKEN"
```

On Windows, put this request in a `.ps1` file and schedule it with Task Scheduler:

```powershell
$headers = @{ Authorization = "Bearer $env:STRAPI_API_TOKEN" }
Invoke-RestMethod -Method Post `
	-Uri "$env:STRAPI_URL/api/social-posts/$env:SOCIAL_POST_ID/dispatch" `
	-Headers $headers
```

The lifecycle trigger remains the immediate automatic path when a post is marked `ready_to_post`.

Strapi comes with a full featured [Command Line Interface](https://docs.strapi.io/dev-docs/cli) (CLI) which lets you scaffold and manage your project in seconds.

### `develop`

Start your Strapi application with autoReload enabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-develop)

```
npm run develop
# or
yarn develop
```

### `start`

Start your Strapi application with autoReload disabled. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-start)

```
npm run start
# or
yarn start
```

### `build`

Build your admin panel. [Learn more](https://docs.strapi.io/dev-docs/cli#strapi-build)

```
npm run build
# or
yarn build
```

## ⚙️ Deployment

Strapi gives you many possible deployment options for your project including [Strapi Cloud](https://cloud.strapi.io). Browse the [deployment section of the documentation](https://docs.strapi.io/dev-docs/deployment) to find the best solution for your use case.

```
yarn strapi deploy
```

## 📚 Learn more

- [Resource center](https://strapi.io/resource-center) - Strapi resource center.
- [Strapi documentation](https://docs.strapi.io) - Official Strapi documentation.
- [Strapi tutorials](https://strapi.io/tutorials) - List of tutorials made by the core team and the community.
- [Strapi blog](https://strapi.io/blog) - Official Strapi blog containing articles made by the Strapi team and the community.
- [Changelog](https://strapi.io/changelog) - Find out about the Strapi product updates, new features and general improvements.

Feel free to check out the [Strapi GitHub repository](https://github.com/strapi/strapi). Your feedback and contributions are welcome!

## ✨ Community

- [Discord](https://discord.strapi.io) - Come chat with the Strapi community including the core team.
- [Forum](https://forum.strapi.io/) - Place to discuss, ask questions and find answers, show your Strapi project and get feedback or just talk with other Community members.
- [Awesome Strapi](https://github.com/strapi/awesome-strapi) - A curated list of awesome things related to Strapi.

---

<sub>🤫 Psst! [Strapi is hiring](https://strapi.io/careers).</sub>
