# Maze Maker

This is a simple tool for creating playable mazes.

It loads up default data, and allows the user to set the size of the maze (in terms of cells wide / cells tall), and to click on walls to toggle them on and off.

The maze data has two different representations:

1. a human-friendly, JSON-based format, and
2. a tightly compressed format stored as base64-encoded string

The compressed format allows for mazes to be shared via URL params, as in:

`https://mazemakerah.netlify.app/?data=CAgAAwcHh0oQseeplRoXVuV1hpulqgs=`
