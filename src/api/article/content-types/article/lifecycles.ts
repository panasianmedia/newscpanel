const pendingArticleIds = new Set<string>();

function queueSocialPost(article: any) {
  if (!article?.id || !article.publishedAt) return;

  const articleId = String(article.id);
  if (pendingArticleIds.has(articleId)) return;
  pendingArticleIds.add(articleId);

  void strapi.db
    .transaction(({ onCommit, onRollback }: any) => {
      onCommit(() => {
        setImmediate(async () => {
          let operation = 'checking for an existing Social Post';
          try {
            const existingPosts = await strapi.entityService.findMany(
              'api::social-post.social-post',
              {
                filters: { article: { id: { $eq: article.id } } },
                fields: ['id', 'platforms'],
              },
            );

            for (const platform of ['instagram', 'facebook'] as const) {
              if (existingPosts.some((existingPost: any) => existingPost.platforms === platform)) {
                continue;
              }

              operation = `creating the ${platform} Social Post`;
              await strapi.entityService.create('api::social-post.social-post', {
                data: {
                  article: article.id,
                  platforms: platform,
                  status: 'ready_to_post',
                },
              });
            }
          } catch (error: any) {
            const nestedErrors = Array.isArray(error?.errors)
              ? error.errors.map((nested: any) => ({
                  name: nested?.name,
                  message: nested?.message || String(nested),
                  details: nested?.details,
                  stack: nested?.stack,
                }))
              : error?.errors;
            const errorDetails = JSON.stringify({
              name: error?.name,
              message: error?.message || String(error),
              details: error?.details,
              errors: nestedErrors,
              stack: error?.stack,
            });
            strapi.log.error(
              `[Article Social Publisher] Failed while ${operation} for article ${articleId}: ${errorDetails}`,
            );
          } finally {
            pendingArticleIds.delete(articleId);
          }
        });
      });

      onRollback(() => pendingArticleIds.delete(articleId));
    })
    .catch((error: unknown) => {
      pendingArticleIds.delete(articleId);
      strapi.log.error(`[Article Social Publisher] Could not schedule article ${articleId}:`, error);
  });
}

export default {
  afterCreate(event: any) {
    queueSocialPost(event.result);
  },

  afterUpdate(event: any) {
    queueSocialPost(event.result);
  },
};