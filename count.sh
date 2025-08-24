#!/bin/bash

#
# A dynamic script to analyze a software project. It counts files and lines of
# code for multiple languages, displays a source file tree, and ignores common
# auto-generated or asset directories.
#

echo "🔍 Starting project analysis..."
echo ""

# --- Configuration ---

# Add any directory names you want to completely ignore during the analysis.
IGNORE_DIRS=(
  ".git"
  "node_modules"
  "__pycache__"
  "venv"
  ".venv"
  "dist"
  "build"
  ".vscode"
  ".idea"
  "env"
  ".next"
  "assets" # Ignoring asset directories
)

# Define the languages to analyze.
# To add a new language, just add a new line here.
# Format: ["Language Name"]="*.ext1 *.ext2"
declare -A LANGUAGES
LANGUAGES=(
  ["Python"]="*.py"
  ["TypeScript"]="*.ts *.tsx"
  ["JavaScript"]="*.js *.jsx"
  ["JSON"]="*.json"
  ["Markdown"]="*.md"
)

# --- Build the 'find' command arguments for pruning ---
PRUNE_ARGS=()
for dir in "${IGNORE_DIRS[@]}"; do
  if [ ${#PRUNE_ARGS[@]} -gt 0 ]; then
    PRUNE_ARGS+=(-o)
  fi
  PRUNE_ARGS+=(-name "$dir")
done
# This builds a command part like: \( -name ".git" -o -name "node_modules" \) -prune
PRUNE_CMD="\( ${PRUNE_ARGS[*]} \) -prune"

# --- Display Source File Tree ---
echo "🌳 Project Source File Structure"
echo "-------------------------------------"

# Build a pattern of all file extensions for the find command
FIND_PATTERN_ARGS=()
for exts in "${LANGUAGES[@]}"; do
  for ext in $exts; do
    FIND_PATTERN_ARGS+=(-o -name "$ext")
  done
done
# Remove the initial '-o'
FIND_PATTERN_CMD="${FIND_PATTERN_ARGS[@]:1}"

# Check if the 'tree' command exists
if command -v tree &>/dev/null; then
  # Use 'tree' if available, as it's cleaner.
  IGNORE_PATTERN=$(
    IFS='|'
    echo "${IGNORE_DIRS[*]}"
  )

  # Build a clean pattern for tree's -P flag, e.g., "*.py|*.ts|*.tsx"
  TREE_PATTERN=""
  for extensions in "${LANGUAGES[@]}"; do
    for ext in $extensions; do
      if [ -n "$TREE_PATTERN" ]; then
        TREE_PATTERN+="|"
      fi
      TREE_PATTERN+="$ext"
    done
  done

  tree -I "$IGNORE_PATTERN" --prune -P "$TREE_PATTERN" --matchdirs
else
  # Fallback to 'find' if 'tree' is not installed.
  eval "find . -type d $PRUNE_CMD -o \( $FIND_PATTERN_CMD \) -print" | sed -e 's;[^/]*/;|____;g;s;____|; |;g'
fi
echo "-------------------------------------"
echo ""

# --- Analysis Functions ---

# Generic function to find files and count their total lines.
# Usage: count_lines "*.ext1" "*.ext2"
count_lines() {
  local extensions=("$@")
  local line_count

  # Build the inclusion part of the command for file extensions
  INCLUDE_ARGS=()
  for ext in "${extensions[@]}"; do
    if [ ${#INCLUDE_ARGS[@]} -gt 0 ]; then
      INCLUDE_ARGS+=(-o)
    fi
    INCLUDE_ARGS+=(-name "$ext")
  done
  INCLUDE_CMD="\( ${INCLUDE_ARGS[*]} \)"

  # Directly pipe find to xargs to correctly handle all filenames.
  # The -r flag for xargs prevents it from running if there's no input.
  line_count=$(eval "find . -type d $PRUNE_CMD -o -type f $INCLUDE_CMD -print0" | xargs -0r wc -l | tail -n 1 | awk '{print $1}')

  echo "${line_count:-0}" # Return 0 if no files are found.
}

# Generic function to count the number of files.
# Usage: count_files "*.ext1" "*.ext2"
count_files() {
  local extensions=("$@")

  INCLUDE_ARGS=()
  for ext in "${extensions[@]}"; do
    if [ ${#INCLUDE_ARGS[@]} -gt 0 ]; then
      INCLUDE_ARGS+=(-o)
    fi
    INCLUDE_ARGS+=(-name "$ext")
  done
  INCLUDE_CMD="\( ${INCLUDE_ARGS[*]} \)"

  local file_count=$(eval "find . -type d $PRUNE_CMD -o -type f $INCLUDE_CMD" | wc -l | awk '{print $1}')
  echo "${file_count:-0}"
}

# --- Execute Analysis & Print Report ---

echo "📊 Project Code Analysis Report"
echo "-------------------------------------"
printf "%-15s | %10s | %15s\n" "Language" "Files" "Lines of Code"
echo "----------------------------------------------------"

TOTAL_FILES=0
TOTAL_LINES=0

# Loop through each defined language, perform the analysis, and print the results.
for lang in "${!LANGUAGES[@]}"; do
  extensions=${LANGUAGES[$lang]}

  file_count=$(count_files $extensions)

  # Only calculate lines and print if files were found
  if [ "$file_count" -gt 0 ]; then
    line_count=$(count_lines $extensions)

    printf "%-15s | %10d | %'15d\n" "$lang" "$file_count" "$line_count"

    TOTAL_FILES=$((TOTAL_FILES + file_count))
    TOTAL_LINES=$((TOTAL_LINES + line_count))
  fi
done

echo "----------------------------------------------------"
printf "%-15s | %10d | %'15d\n" "TOTAL" "$TOTAL_FILES" "$TOTAL_LINES"
echo "----------------------------------------------------"
