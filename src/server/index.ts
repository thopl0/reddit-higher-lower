import express from 'express';
import { createServer, context, getServerPort, redis, reddit } from '@devvit/web/server';
import { createPost } from './core/post';
import gameRouter from './app/game/game.router';
import { leaderboardRouter } from './app/leaderboard/leaderboard.router';
import { UserService } from './app/user/user.service';
import { RedisUtils } from './lib/redis.utils';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());

const router = express.Router();

router.use('/api/game', gameRouter);
router.use('/api/leaderboard', leaderboardRouter);

router.get('/api/init', async (_req, res): Promise<void> => {
  // await UserService.initUser();
  // await RedisUtils.clearRedis();
  res.status(201).json({ status: 'success' });
});

router.post('/internal/on-app-install', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      status: 'success',
      message: `Post created in subreddit ${context.subredditName} with id ${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

router.post('/internal/menu/post-create', async (_req, res): Promise<void> => {
  try {
    const post = await createPost();

    res.json({
      navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
    });
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    res.status(400).json({
      status: 'error',
      message: 'Failed to create post',
    });
  }
});

app.use(router);

const port = getServerPort();

const server = createServer(app);
server.on('error', (err) => console.error(`server error; ${err.stack}`));
console.log(`listening on port ${port}`);
server.listen(port);
