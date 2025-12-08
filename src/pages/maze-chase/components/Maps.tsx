import { useEffect, useRef } from "react";

// tekstur tile
import wallA from "../assets/maze/wall.jpeg";
import floorA from "../assets/maze/floor.jpeg";

import wallB from "../assets/maze/wall.jpeg";
import floorB from "../assets/maze/floor.jpeg";

import wallC from "../assets/maze/wall.jpeg";
import floorC from "../assets/maze/floor.jpeg";

const TILE_SIZE = 18;

type Direction = "up" | "down" | "left" | "right";

interface MapsProps {
  mapId: string | number;
  controlDirection?: Direction | null; // dari Game.tsx (arrow button)
}

// ========== MAZE ==========
// 0 = jalan, selain 0 = tembok (bisa kamu custom jenisnya)
const MAP_LAYOUTS: Record<string, number[][]> = {
  "1": 
    // PASTIKAN nanti semua baris panjangnya sama

[
[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
[1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
[1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
[1,0,0,0,0,1,0,0,1,1,1,1,0,0,1,0,0,1,1,1,1,1,1,1,1,0,0,1,0,0,1,0,0,0,0,1],
[1,1,1,1,1,1,0,0,1,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,1,0,0,1,0,0,1,1,1,1,1,1],
[1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1,1,1,1,1,1,1,1,0,0,1,0,0,0,0,0,0,0,1],
[1,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,0,0,1],
[1,0,0,1,1,1,1,1,1,0,0,1,0,0,1,0,0,0,0,0,0,0,0,0,1,0,0,1,1,1,1,1,1,0,0,1],
[1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,1,1,1,1,0,0,1,0,0,0,0,0,0,0,1,0,0,1],
[1,0,0,0,0,0,0,0,0,0,0,1,0,0,1,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
[1,0,0,1,1,1,1,1,1,0,0,1,0,0,1,0,0,1,0,0,0,1,0,0,0,0,0,1,1,1,0,0,1,0,0,1],
[1,0,0,1,0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0,1,1,1,1,0,0,0,0,0,0,0,0,0,0,1],
[1,0,0,1,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
[1,0,0,1,1,1,1,1,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,0,0,1],
[1,0,0,0,0,0,0,0,1,0,0,0,0,0,1,1,1,1,0,0,1,1,1,1,1,0,0,1,0,0,0,0,1,0,0,1], 
[1,0,0,0,0,0,0,0,1,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0,0,1],
[1,1,1,1,1,1,0,0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0,0,1,0,0,1,0,0,1,1,1,0,0,1],
[1,0,0,0,0,1,1,1,1,0,0,1,1,1,1,0,0,1,0,0,1,1,1,1,1,0,0,1,1,1,1,0,0,0,0,1],
[1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
[1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],

],
  "2": [
    [1,1,1,1,1,1,1,1],
    [1,0,0,0,1,0,0,1],
    [1,0,1,0,0,1,0,1],
    [1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1],
  ],
  "3": [
    [1,1,1,1,1],
    [1,0,0,1,1],
    [1,1,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
  ],
};

const MAP_TEXTURES: Record<string, { wall: string; floor: string }> = {
  "1": { wall: wallA, floor: floorA },
  "2": { wall: wallB, floor: floorB },
  "3": { wall: wallC, floor: floorC },
};

// ========== HELPER ==========

function isWalkable(map: number[][], x: number, y: number): boolean {
  if (y < 0 || y >= map.length) return false;
  if (x < 0 || x >= map[0].length) return false;
  return map[y][x] === 0;
}

function getDelta(dir: Direction) {
  switch (dir) {
    case "up":
      return { dx: 0, dy: -1 };
    case "down":
      return { dx: 0, dy: 1 };
    case "left":
      return { dx: -1, dy: 0 };
    case "right":
      return { dx: 1, dy: 0 };
  }
}

interface Entity {
  tileX: number;
  tileY: number;
  dir: Direction;
  moving: boolean;
  moveProgress: number; // 0..1
  speed: number; // tiles per second
  frameIndex: number;
  frameTimer: number;
}

// ========== MAIN COMPONENT ==========

const Maps = ({ mapId, controlDirection }: MapsProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maze = MAP_LAYOUTS[String(mapId)] ?? MAP_LAYOUTS["1"];
  const texture = MAP_TEXTURES[String(mapId)] ?? MAP_TEXTURES["1"];

  // Refs for game state
  const playerRef = useRef<Entity | null>(null);
  const npcsRef = useRef<Entity[]>([]);
  const keyboardDirRef = useRef<Direction | null>(null);
  const externalDirRef = useRef<Direction | null>(null);
  const requestIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // update when prop direction changes
  useEffect(() => {
    externalDirRef.current = controlDirection ?? null;
  }, [controlDirection]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = false;

    // init images
    const wallImg = new Image();
    wallImg.src = texture.wall;
    const floorImg = new Image();
    floorImg.src = texture.floor;

    // TODO: ganti dengan path sprite kamu sendiri (taruh di public/ atau import)
    // sementara kita skip load image dan pakai rect warna saja

    // init player
    const player: Entity = {
      tileX: 1,
      tileY: 1,
      dir: "right",
      moving: false,
      moveProgress: 0,
      speed: 5, // tiles per second
      frameIndex: 0,
      frameTimer: 0,
    };
    playerRef.current = player;

    // init NPCs (4 random)
    const walkableTiles: { x: number; y: number }[] = [];
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[0].length; x++) {
        if (maze[y][x] === 0 && !(x === player.tileX && y === player.tileY)) {
          walkableTiles.push({ x, y });
        }
      }
    }

    const npcs: Entity[] = [];
    const npcCount = Math.min(4, walkableTiles.length);
    for (let i = 0; i < npcCount; i++) {
      const idx = Math.floor(Math.random() * walkableTiles.length);
      const spawn = walkableTiles.splice(idx, 1)[0];
      npcs.push({
        tileX: spawn.x,
        tileY: spawn.y,
        dir: "left",
        moving: false,
        moveProgress: 0,
        speed: 1, // slower than player, tapi bisa ngebut saat chase
        frameIndex: 0,
        frameTimer: 0,
      });
    }
    npcsRef.current = npcs;

    // keyboard controls
    const onKeyDown = (e: KeyboardEvent) => {
      let dir: Direction | null = null;
      if (e.key === "ArrowUp" || e.key === "w") dir = "up";
      if (e.key === "ArrowDown" || e.key === "s") dir = "down";
      if (e.key === "ArrowLeft" || e.key === "a") dir = "left";
      if (e.key === "ArrowRight" || e.key === "d") dir = "right";
      if (dir) {
        keyboardDirRef.current = dir;
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    const updateEntityAnimation = (entity: Entity, dt: number) => {
      if (entity.moving) {
        entity.frameTimer += dt;
        const frameDuration = 0.15; // detik per frame
        if (entity.frameTimer >= frameDuration) {
          entity.frameTimer -= frameDuration;
          entity.frameIndex = (entity.frameIndex + 1) % 2; // minimal 2 frame
        }
      } else {
        entity.frameIndex = 0;
        entity.frameTimer = 0;
      }
    };

    const tryStartMove = (entity: Entity, dir: Direction, speedTilesPerSec: number) => {
      const { dx, dy } = getDelta(dir);
      const targetX = entity.tileX + dx;
      const targetY = entity.tileY + dy;
      if (isWalkable(maze, targetX, targetY)) {
        entity.dir = dir;
        entity.moving = true;
        entity.moveProgress = 0;
        entity.speed = speedTilesPerSec;
      }
    };

    const hasLineOfSight = (from: Entity, to: Entity): boolean => {
      if (from.tileX === to.tileX) {
        const x = from.tileX;
        const yStart = Math.min(from.tileY, to.tileY);
        const yEnd = Math.max(from.tileY, to.tileY);
        for (let y = yStart + 1; y < yEnd; y++) {
          if (!isWalkable(maze, x, y)) return false;
        }
        return true;
      }
      if (from.tileY === to.tileY) {
        const y = from.tileY;
        const xStart = Math.min(from.tileX, to.tileX);
        const xEnd = Math.max(from.tileX, to.tileX);
        for (let x = xStart + 1; x < xEnd; x++) {
          if (!isWalkable(maze, x, y)) return false;
        }
        return true;
      }
      return false;
    };

    const randDir = (): Direction => {
      const dirs: Direction[] = ["up", "down", "left", "right"];
      return dirs[Math.floor(Math.random() * dirs.length)];
    };

    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = (time - lastTimeRef.current) / 1000; // in seconds
      lastTimeRef.current = time;

      // --- UPDATE PLAYER ---
      if (playerRef.current) {
        const p = playerRef.current;
        const wantedDir = externalDirRef.current || keyboardDirRef.current || p.dir;

        if (!p.moving && wantedDir) {
          tryStartMove(p, wantedDir, 5);
        }

        if (p.moving) {
          p.moveProgress += p.speed * dt;
          if (p.moveProgress >= 1) {
            const { dx, dy } = getDelta(p.dir);
            p.tileX += dx;
            p.tileY += dy;
            p.moving = false;
            p.moveProgress = 0;
          }
        }

        updateEntityAnimation(p, dt);
      }

      // --- UPDATE NPCs ---
      if (playerRef.current) {
        const p = playerRef.current;
        const npcs = npcsRef.current;
        for (const npc of npcs) {
          const dist =
            Math.abs(npc.tileX - p.tileX) + Math.abs(npc.tileY - p.tileY);
          const seePlayer = hasLineOfSight(npc, p);
          let targetSpeed = 1;

          if (dist <= 5 || seePlayer) {
            // CHASE MODE
            targetSpeed = 2;
            let bestDir: Direction | null = null;
            let bestDist = dist;

            (["up", "down", "left", "right"] as Direction[]).forEach((dir) => {
              const { dx, dy } = getDelta(dir);
              const tx = npc.tileX + dx;
              const ty = npc.tileY + dy;
              if (isWalkable(maze, tx, ty)) {
                const newDist =
                  Math.abs(tx - p.tileX) + Math.abs(ty - p.tileY);
                if (newDist < bestDist) {
                  bestDist = newDist;
                  bestDir = dir;
                }
              }
            });

            if (!npc.moving && bestDir) {
              tryStartMove(npc, bestDir, targetSpeed);
            }
          } else {
            // RANDOM WALK
            if (!npc.moving) {
              let tries = 0;
              let dir: Direction = npc.dir;
              do {
                dir = randDir();
                const { dx, dy } = getDelta(dir);
                const tx = npc.tileX + dx;
                const ty = npc.tileY + dy;
                if (isWalkable(maze, tx, ty)) {
                  tryStartMove(npc, dir, targetSpeed);
                  break;
                }
                tries++;
              } while (tries < 8);
            }
          }

          if (npc.moving) {
            npc.moveProgress += npc.speed * dt;
            if (npc.moveProgress >= 1) {
              const { dx, dy } = getDelta(npc.dir);
              npc.tileX += dx;
              npc.tileY += dy;
              npc.moving = false;
              npc.moveProgress = 0;
            }
          }

          updateEntityAnimation(npc, dt);
        }
      }

      // --- RENDER ---
      const width = maze[0].length * TILE_SIZE;
      const height = maze.length * TILE_SIZE;
      canvas.width = width;
      canvas.height = height;

      // draw tiles
      for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[0].length; x++) {
          const tile = maze[y][x];
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;
          if (tile === 0) {
            ctx.drawImage(floorImg, px, py, TILE_SIZE, TILE_SIZE);
          } else {
            ctx.drawImage(wallImg, px, py, TILE_SIZE, TILE_SIZE);
            // nanti bisa: if tile===2 => wall khusus, dll
          }
        }
      }

      // draw NPCs
      const npcs = npcsRef.current;
      for (const npc of npcs) {
        const { dx, dy } = getDelta(npc.dir);
        const off = npc.moving ? npc.moveProgress : 0;
        const x =
          (npc.tileX + dx * off + 0.5) * TILE_SIZE; // center
        const y =
          (npc.tileY + dy * off + 0.5) * TILE_SIZE;
        const size = TILE_SIZE * 0.8;

        // sementara: kotak merah
        ctx.fillStyle = "rgba(255,0,0,0.9)";
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // draw player
      if (playerRef.current) {
        const p = playerRef.current;
        const { dx, dy } = getDelta(p.dir);
        const off = p.moving ? p.moveProgress : 0;
        const x = (p.tileX + dx * off + 0.5) * TILE_SIZE;
        const y = (p.tileY + dy * off + 0.5) * TILE_SIZE;
        const size = TILE_SIZE * 0.8;

        // sementara: kotak biru (nanti ganti sprite animasi)
        ctx.fillStyle = "rgba(0,160,255,0.95)";
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      requestIdRef.current = requestAnimationFrame(loop);
    };

    requestIdRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (requestIdRef.current) cancelAnimationFrame(requestIdRef.current);
    };
  }, [mapId, texture.wall, texture.floor, maze]);

  return (
    <div className="flex justify-center items-center w-full h-full">
      <canvas
        ref={canvasRef}
        className="border border-gray-500 max-w-full h-auto"
        style={{ imageRendering: "pixelated" as any }}
      />
    </div>
  );
};

export default Maps;
