# sticctionary

testing branch perms

<h2>Contribute</h2>

For approved collaborators, first clone repository on to local machine.

`git clone https://github.com/n-parisi/sticctionary.git`

Each time you want to work on a new issue or a certain element of the code, you will create a new branch.

`git checkout -b [name of your branch]`

See all branches, and see which branch you are currently on.

`git branch`

Do some work on your local branch...

```
git add file1.js
git add file2.js
git commit -m "first commit!"

//do some more work

git add file3.js
git add file1.js
git commit -m "Second commit! more features!"
```

When you are satisfied with your work and ready to merge it into the master branch, push the local branch to github

`git push origin [name of your branch]`

Go to the repo page on GitHub.com, press "Create pull request" button. Set "compare" to your branch. Create the pull request. Once repo owner (me) accepts changes, your branch will be merged into the master branch.

<h2>Install and Run</h2>

```
npm install
npm start
```

Game will be hosted on http://localhost:3000/sticc
