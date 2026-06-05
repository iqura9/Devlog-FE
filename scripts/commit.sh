#!/bin/bash
set -e

# Colors
RESET="\033[0m"
BOLD="\033[1m"
DIM="\033[2m"
CYAN="\033[36m"
GREEN="\033[32m"
YELLOW="\033[33m"
MAGENTA="\033[35m"
RED="\033[31m"

spinner() {
  local pid=$1
  local frames=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
  local i=0
  while kill -0 "$pid" 2>/dev/null; do
    printf "\r  ${CYAN}${frames[$i]}${RESET}  ${DIM}Analyzing changes with Haiku...${RESET}"
    i=$(( (i + 1) % ${#frames[@]} ))
    sleep 0.08
  done
  printf "\r\033[K"
}

DIFF=$(git diff --staged)

if [ -z "$DIFF" ]; then
  echo -e "\n  ${RED}✖${RESET}  No staged changes. Run ${BOLD}git add${RESET} first.\n"
  exit 1
fi

# Truncate diff to ~15k chars to stay within token limits
DIFF_TRUNCATED=$(echo "$DIFF" | head -c 15000)
if [ ${#DIFF} -gt 15000 ]; then
  DIFF_TRUNCATED="${DIFF_TRUNCATED}
... (diff truncated, $(git diff --staged --stat | tail -1))"
fi

echo ""

# Run claude in background so spinner can animate
echo "$DIFF_TRUNCATED" | claude --model claude-haiku-4-5-20251001 -p \
  "Analyze this git diff and output ONLY a conventional commit message in the format: <type>[scope]: <description>. No explanation, just the message." \
  > /tmp/_commit_msg.txt &

spinner $!
if ! wait $!; then
  echo -e "  ${RED}✖${RESET}  Claude failed to generate a message. Type your commit message:\n"
  SUGGESTED=""
else
  SUGGESTED=$(cat /tmp/_commit_msg.txt)
fi
rm -f /tmp/_commit_msg.txt

echo -e "  ${GREEN}✔${RESET}  ${BOLD}Suggested commit:${RESET}\n"
echo -e "  ${MAGENTA}${BOLD}${SUGGESTED}${RESET}\n"
echo -e "  ${DIM}Press Enter to use it, or type your own message:${RESET}"
printf "  ${YELLOW}›${RESET} "
read -r CUSTOM

echo ""
git commit -m "${CUSTOM:-$SUGGESTED}"
echo -e "\n  ${GREEN}${BOLD}✔ Committed!${RESET}\n"
