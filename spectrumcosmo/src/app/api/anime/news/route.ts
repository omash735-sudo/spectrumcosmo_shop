import Parser from 'rss-parser'

const parser = new Parser()

export async function GET() {
  try {
    // 1. AniList (Trending Anime)
    const aniRes = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: `
          query {
            Page(perPage: 5) {
              media(sort: TRENDING_DESC, type: ANIME) {
                id
                title {
                  romaji
                }
                coverImage {
                  large
                }
                averageScore
              }
            }
          }
        `,
      }),
    })

    const aniData = await aniRes.json()

    const trending = aniData?.data?.Page?.media?.map((item: any) => ({
      type: 'trending',
      title: item.title.romaji,
      image: item.coverImage.large,
      score: item.averageScore,
    })) || []

    // 2. RSS Anime News (Anime News Network)
    const feed = await parser.parseURL(
      'https://www.animenewsnetwork.com/news/rss.xml'
    )

    const news = feed.items.slice(0, 5).map((item) => ({
      type: 'news',
      title: item.title,
      link: item.link,
      date: item.pubDate,
    }))

    // 3. Merge feed
    const combined = [
      ...trending,
      ...news,
    ]

    return Response.json({
      success: true,
      data: combined,
    })
  } catch (err) {
    console.error(err)

    return Response.json(
      { error: 'Failed to load anime news' },
      { status: 500 }
    )
  }
}
