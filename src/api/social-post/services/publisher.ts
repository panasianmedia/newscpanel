import axios from 'axios';

type SocialPost = {
  articleUrl?: string;
  imageUrl?: string;
  article?: {
    slug?: string;
    title?: string;
    excerpt?: string;
    coverImage?: { url?: string };
  };
  caption_facebook?: string;
  caption_instagram?: string;
  caption_linkedin?: string;
  custom_media?: { url?: string };
  platforms: string[];
};

type PublishResults = {
  errors: Record<string, string>;
  successes: string[];
};

export default () => ({
  async dispatch(post: SocialPost): Promise<PublishResults> {
    const results: PublishResults = { errors: {}, successes: [] };
    const siteUrl = process.env.FRONTEND_URL || 'https://yournewsdomain.com';
    const articleUrl = post.articleUrl || (post.article ? `${siteUrl}/news/${post.article.slug}` : '');
    const mediaObj = post.custom_media || post.article?.coverImage;
    const mediaUrl = post.imageUrl || (mediaObj?.url?.startsWith('http')
      ? mediaObj.url
      : `${process.env.STRAPI_URL || ''}${mediaObj?.url || ''}`);

    if (post.platforms.includes('facebook')) {
      try {
        const message = post.caption_facebook || `${post.article?.title}\n\n${articleUrl}`;
        if (mediaUrl) {
          await axios.post(`https://graph.facebook.com/v21.0/${process.env.FB_PAGE_ID}/photos`, {
            url: mediaUrl,
            caption: message,
            access_token: process.env.FB_PAGE_ACCESS_TOKEN,
          });
        } else {
          await axios.post(`https://graph.facebook.com/v21.0/${process.env.FB_PAGE_ID}/feed`, {
            message,
            link: articleUrl || undefined,
            access_token: process.env.FB_PAGE_ACCESS_TOKEN,
          });
        }
        results.successes.push('facebook');
      } catch (err: any) {
        results.errors.facebook = err.response?.data?.error?.message || err.message;
      }
    }

    if (post.platforms.includes('instagram')) {
      try {
        if (!mediaUrl) throw new Error('Instagram requires a public image URL.');
        const caption = post.caption_instagram || post.article?.title;
        const container = await axios.post(`https://graph.facebook.com/v21.0/${process.env.IG_USER_ID}/media`, {
          image_url: mediaUrl,
          caption,
          access_token: process.env.FB_PAGE_ACCESS_TOKEN,
        });
        await axios.post(`https://graph.facebook.com/v21.0/${process.env.IG_USER_ID}/media_publish`, {
          creation_id: container.data.id,
          access_token: process.env.FB_PAGE_ACCESS_TOKEN,
        });
        results.successes.push('instagram');
      } catch (err: any) {
        results.errors.instagram = err.response?.data?.error?.message || err.message;
      }
    }

    if (post.platforms.includes('linkedin')) {
      try {
        const commentary = post.caption_linkedin || `${post.article?.title}\n\n${articleUrl}`;
        const content = articleUrl
          ? {
              article: {
                source: articleUrl,
                title: post.article?.title || 'Breaking News',
                description: post.article?.excerpt || '',
                thumbnail: mediaUrl || undefined,
              },
            }
          : undefined;

        await axios.post(
          'https://api.linkedin.com/rest/posts',
          {
            author: `urn:li:organization:${process.env.LINKEDIN_ORG_ID}`,
            commentary,
            visibility: 'PUBLIC',
            distribution: {
              feedDistribution: 'MAIN_FEED',
              targetEntities: [],
              thirdPartyDistributionChannels: [],
            },
            ...(content && { content }),
            lifecycleState: 'PUBLISHED',
          },
          {
            headers: {
              Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
              'LinkedIn-Version': '202401',
              'X-Restli-Protocol-Version': '2.0.0',
            },
          },
        );
        results.successes.push('linkedin');
      } catch (err: any) {
        results.errors.linkedin = err.response?.data?.message || err.message;
      }
    }

    return results;
  },
});