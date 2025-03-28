# NodeJS-based Lighthouse Test for Web Pages
Basic lighthouse (core web vitals) performance testing script, written in Node.JS and runs on Windows without modifications (can run on other platforms if you change a few things, like the Chrome binary path).

It'll complete multiple runs, outputting results into a CSV including a row for average, min and max values.

Example usage

```
node index.js "Initial run without changes"
```

Edit the script to alter things like;
- The page URL you're testing.
- Number of iterations.
- Report filename.

(you could easily alter the script to accept these as parameters if you need to).

![Run Complete](page-metrics-run-complete.png)

![CSV](page-metrics-csv.png)
