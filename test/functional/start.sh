#!/bin/sh
run_test_command()
{
  eval "$FUNC_TEST_CMD"
}

set -o pipefail && run_test_command
