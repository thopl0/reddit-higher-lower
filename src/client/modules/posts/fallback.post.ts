import { RedditPost } from '../../types/post';

const fallBackPost: RedditPost = {
  id: 'fallback',
  authorId: 'unknown',
  authorName: 'unknown',
  subredditId: 'unknown',
  subredditName: 'unknown',
  permalink: '',
  title: 'Fallback Post',
  body: '',
  url: '',
  thumbnail: {
    url: '',
    height: 0,
    width: 0,
  },
  score: 0,
  numberOfComments: 0,
  numberOfReports: 0,
  createdAt: new Date().toISOString(),
  approved: false,
  spam: false,
  stickied: false,
  removed: false,
  archived: false,
  edited: false,
  locked: false,
  nsfw: false,
  quarantined: false,
  spoiler: false,
  hidden: false,
  ignoringReports: false,
  flair: {
    backgroundColor: '',
    type: '',
    richtext: [],
    textColor: '',
  },
  modReportReasons: [],
  userReportReasons: [],
};

export default fallBackPost;
