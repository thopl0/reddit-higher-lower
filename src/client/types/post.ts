export interface RedditPost {
  id: string;
  authorId: string;
  authorName: string;
  subredditId: string;
  subredditName: string;
  permalink: string;
  title: string;
  body: string;
  url: string;
  thumbnail: {
    url: string;
    height: number;
    width: number;
  };
  score: number;
  numberOfComments: number;
  numberOfReports: number;
  createdAt: string; // ISO date string
  approved: boolean;
  spam: boolean;
  stickied: boolean;
  removed: boolean;
  archived: boolean;
  edited: boolean;
  locked: boolean;
  nsfw: boolean;
  quarantined: boolean;
  spoiler: boolean;
  hidden: boolean;
  ignoringReports: boolean;
  flair: {
    backgroundColor: string;
    type: string;
    richtext: any[]; // unknown structure, can refine if needed
    textColor: string;
  };
  modReportReasons: string[];
  userReportReasons: string[];
}
