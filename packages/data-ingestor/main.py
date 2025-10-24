import os
import argparse

from convex import ConvexClient
from dotenv import load_dotenv

load_dotenv(".env.local")
CONVEX_URL = os.getenv("CONVEX_URL")

client = ConvexClient(CONVEX_URL)

def cli() -> None:
  """
  Module Entry point. We run this with with:
    uv run -m example-pkg.main
  """

  # Example on how to make a simple CLI with argparse unsing the functions from this example-pkg
  parser = argparse.ArgumentParser(description="example-pkg module runner")
  parser.add_argument("--name", "-n", default="World", help="Name to greet")
  args = parser.parse_args()

  print(args.name)

  # Example on how to use Convex client to query and subscribe to a Convex backend
  print(client.query("todos:getAll"))

  for tasks in client.subscribe("todos:getAll"):
      print(tasks)
      # this loop lasts forever, ctrl-c to exit it



if __name__ == "__main__":
  cli()
