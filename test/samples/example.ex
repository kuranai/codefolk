defmodule Codefolk.Theme do
  @moduledoc "A visual fixture for Elixir semantic and TextMate tokens."

  @spec load() :: {:ok, map()} | {:error, term()}
  def load do
    with {:ok, palette} <- fetch_palette() do
      {:ok, %{palette: palette, ready?: true}}
    end
  end

  defp fetch_palette, do: {:ok, %{accent: "#705697"}}
end
