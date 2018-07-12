# google-storage-bucket-cors-config.json

CORS settings are set on a per-bucket basis. Note the maxAge in the cors config refers to preflight request cache and won't affect caching of individual resources.

```bash
gsutil cors set google-storage-bucket-cors-config.json gs://predictions-global-staging
```

ie. our current staging bucket is `gs://predictions-global-staging`[1] (also see .env-cmdrc which are staging/prod/env-specific variables for front end only.)

[1] this is the same name as our Google Cloud project `predictions-global-staging`, but the project is distinct from the bucket. (The bucket is inside the project.)
