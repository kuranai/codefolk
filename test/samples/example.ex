defmodule Codefolk.Theme do
  @moduledoc "A visual fixture for Elixir semantic and TextMate tokens."

  @type mode :: :light | :dark

  @spec load(mode()) :: {:ok, map()} | {:error, term()}
  def load(mode) when mode in [:light, :dark] do
    with {:ok, palette} <- fetch_palette(mode) do
      {:ok, %{mode: mode, palette: palette, ready?: true}}
    end
  end

  defp fetch_palette(:dark), do: {:ok, %{accent: "#ef820c"}}
  defp fetch_palette(:light), do: {:ok, %{accent: "#705697"}}
end
