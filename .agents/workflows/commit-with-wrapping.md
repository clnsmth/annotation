---
description: Create a compliant commit with strict 72-character line wrapping
---

# Commit with Wrapping Workflow

**Purpose**: Agent instructions on how to reliably write commit messages that conform to the strict 72-character limits enforced by the project.

When committing changes, agents often struggle to mathematically adhere to the strict 72-character line wrapping limit for the commit body required in `AGENTS.md`. To reliably meet this requirement, ALWAYS use this workflow when committing.

## Steps

### Step 1: Write raw commit to a temp file
Use your `write_to_file` tool to create a temporary file called `/tmp/raw_commit.txt`.

In this file, write your raw commit using the required **Angular commit style**. 
Ensure the header line (the very first line) is strictly under 52 characters. 
For the body paragraphs that follow, simply write your complete content without manually worrying about the 72-character boundaries. `fmt` will format it for you. 
Also include the footer (e.g. `Closes #123`) if applicable, separated by a blank line. 

Example content:
```text
feat(engine): add cool feature

This is an extremely long continuous string of text that will act as a paragraph and whether or not it will actually wrap will be handled gracefully when we apply our format utility.

Closes #123
```

### Step 2: Format and Commit
Use your `run_command` tool to stage the changes, automatically format the temp file to 72 characters via `fmt`, and pipe the result directly into `git commit`.

// turbo-all
```bash
git add .
fmt -w 72 /tmp/raw_commit.txt | git commit -F -
```

### Step 3: Cleanup
Remove the temporary file.

```bash
rm -f /tmp/raw_commit.txt
```
