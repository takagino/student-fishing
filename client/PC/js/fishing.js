class FishingGame {
  constructor() {
    this.setupCanvas();
    this.loadFishData(); // fish.jsonをロードする関数
    this.setupSocketConnection();
    this.gameLoop();
    this.fishData = [];
  }

  async loadFishData() {
    try {
      const response = await fetch("../json/fish.json");
      if (!response.ok) throw new Error("Failed to load fish data.");
      this.fishData = await response.json();
      console.log("Fish data loaded:", this.fishData); // ロードしたデータを出力
      this.createFishes(8); // 魚を生成
      console.log("Created fishes after loading fishData:", this.fishes); // 魚リストを出力
    } catch (error) {
      console.error("Error loading fish data:", error);
      this.fishData = [];
      this.createFishes(5); // デフォルト魚を生成
      console.log("Created default fishes:", this.fishes); // デフォルト魚リストを出力
    }
  }

  setupCanvas() {
    this.canvas = document.getElementById("gameCanvas");
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.ctx = this.canvas.getContext("2d");
    this.lure = {
      x: window.innerWidth / 2,
      y: 100,
    };
  }
  createFishes(count) {
    // rarityごとの魚のカウント
    let rarityCounts = {
      1: 0, // rarity 1の魚、最大2匹まで
      5: 0, // rarity 5の魚、最大1匹まで
      6: 0, // rarity 6の魚、最大1匹まで
    };

    this.fishes = [];

    // 魚を生成する
    for (let i = 0; i < count; i++) {
      let randomFish;
      const fishRarity = Math.random();

      // rarity 6（1/100の確率で出現）
      if (fishRarity < 0.01 && rarityCounts[6] < 1) {
        randomFish = this.fishData.filter((fish) => fish.rarity === 6);
        if (randomFish.length > 0) {
          rarityCounts[6] += 1;
          this.fishes.push(randomFish[0]);
          continue; // rarity 6の魚を生成したので次へ
        }
      }

      // rarity 5（1/10の確率で出現）
      if (fishRarity < 0.1 && rarityCounts[5] < 1) {
        randomFish = this.fishData.filter((fish) => fish.rarity === 5);
        if (randomFish.length > 0) {
          rarityCounts[5] += 1;
          this.fishes.push(randomFish[0]);
          continue; // rarity 5の魚を生成したので次へ
        }
      }

      // rarity 1（1/6の確率で出現）
      if (fishRarity < 0.18 && rarityCounts[1] < 2) {
        randomFish = this.fishData.filter((fish) => fish.rarity === 1);
        if (randomFish.length > 0) {
          rarityCounts[1] += 1;
          this.fishes.push(randomFish[0]);
          continue; // rarity 1の魚を生成したので次へ
        }
      }

      // 他のレアリティ（rarity 2, 3, 4）をランダムに選ぶ
      randomFish = this.fishData.filter(
        (fish) => fish.rarity !== 1 && fish.rarity !== 5 && fish.rarity !== 6
      );
      this.fishes.push(
        randomFish[Math.floor(Math.random() * randomFish.length)]
      ); // rarity 2, 3, 4 の魚をランダムで選ぶ
    }

    // 魚の速度設定などを行う
    this.fishes = this.fishes.map((fish) => {
      let baseSpeed = 1; // 基本速度
      if (fish.rarity === 1) {
        baseSpeed = 0.8; // rarity 1（最もレア）は最遅
      } else if (fish.rarity === 5) {
        baseSpeed = 50.0; // rarity 5は速い
      } else if (fish.rarity === 6) {
        baseSpeed = 60.0; // rarity 6は速い
      } else {
        baseSpeed += (fish.rarity - 1) * 7.8; // rarityが高いほど速くなる
      }

      return {
        x: Math.random() * window.innerWidth,
        y: 200 + Math.random() * (window.innerHeight - 300),
        speed: baseSpeed,
        direction: Math.random() < 0.5 ? -1 : 1,
        caught: false,
        data: fish, // 魚のデータを保持
      };
    });
  }

  drawFish(fish) {
    const fishImage = new Image();
    fishImage.src = "../images/Silhouette.svg";
    if (fish.data.rarity === 5) {
      fishImage.src = "../images/redsilhouette.svg";
    }
    if (fish.data.rarity === 1) {
      fishImage.src = "../images/greensilhouette.svg";
    }
    if (fish.data.rarity === 6) {
      fishImage.src = "../images/goldshil.svg";
    }

    const shadowSize = 80;

    // 水平反転するための準備
    this.ctx.save(); // 現在の状態を保存

    if (fish.direction === 1) {
      // 魚が左に移動している場合は反転
      this.ctx.scale(-1, 1); // 水平反転
      this.ctx.drawImage(
        fishImage,
        -fish.x - shadowSize / 2, // 反転時の x 座標調整
        fish.y - shadowSize / 2,
        shadowSize,
        shadowSize
      );
    } else {
      // 通常の描画
      this.ctx.drawImage(
        fishImage,
        fish.x - shadowSize / 2,
        fish.y - shadowSize / 2,
        shadowSize,
        shadowSize
      );
    }

    this.ctx.restore(); // 状態を元に戻す
  }
  drawLure() {
    this.ctx.fillStyle = "#FF0000";
    this.ctx.beginPath();
    this.ctx.arc(this.lure.x, this.lure.y, 10, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = "#FFFFFF";
    this.ctx.beginPath();
    this.ctx.moveTo(this.lure.x, 0);
    this.ctx.lineTo(this.lure.x, this.lure.y);
    this.ctx.stroke();
  }
  setupSocketConnection() {
    this.socket = io();
    this.socket.on("gyroscope", (data) => {
      // y方向の制限はそのまま
      this.lure.y += data.x * -5;
      this.lure.y = Math.max(0, Math.min(this.canvas.height, this.lure.y));

      // x方向の制限を修正
      this.lure.x += data.y * 5;
      this.lure.x = Math.max(0, Math.min(this.canvas.width, this.lure.x)); // canvas.widthで制限
    });
  }

  checkCollision(fish) {
    const dx = fish.x - this.lure.x;
    const dy = fish.y - this.lure.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < 30;
  }

  getRandomFish() {
    // rarityに基づいてランダムに魚を選ぶ
    const weightedFish = this.fishData.flatMap((fish) =>
      Array(6 - fish.rarity).fill(fish)
    );
    return weightedFish[Math.floor(Math.random() * weightedFish.length)];
  }
  gameLoop() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // fishesが未定義の場合は処理をスキップ
    if (!this.fishes || this.fishes.length === 0) {
      this.drawLure();
      requestAnimationFrame(() => this.gameLoop());
      return;
    }

    this.fishes.forEach((fish) => {
      if (fish.caught) {
        // 釣り上げられた魚の情報を保持
        const caughtFishData = fish.data; // 釣り上げた魚のデータを保持
        fish.x = this.lure.x;
        fish.y = this.lure.y;
        console.log("Caught fish:", caughtFishData.name);
        this.fishCaught = true;

        if (fish.y <= 50) {
          // 釣り上げた魚のデータを使ってポップアップ表示
          const popup = document.getElementById("popup");
          const fishName = document.getElementById("fish-name");
          const fishImage = document.getElementById("fish-image");
          const fishDescription = document.getElementById("fish-description");
          const fishSize = document.getElementById("fish-size");
          const fishRarity = document.getElementById("fish-rarity");

          // ポップアップの内容を設定
          fishImage.src = caughtFishData.image; // 魚の画像
          fishName.textContent = `名前: ${caughtFishData.name}`;
          fishDescription.textContent = `説明: ${caughtFishData.description}`;
          fishSize.textContent = `サイズ: ${caughtFishData.size_cm}cm`;
          fishRarity.textContent = `レア度: ${"★".repeat(
            caughtFishData.rarity
          )}`;
          if (caughtFishData.rarity === 6) {
            fishRarity.style.color = "gold";
          } else if (caughtFishData.rarity === 1) {
            fishRarity.style.color = "green";
          } else {
            fishRarity.style.color = "white";
          }

          const socket = io();

          // ポップアップを表示
          popup.style.display = "block";
          // display: blockになった直後にモバイルへ送信
          if (popup.style.display === "block") {
            socket.emit("show_fish_data", caughtFishData);
          }

          // 魚を削除
          this.fishes = this.fishes.filter((f) => f !== fish);

          // ポップアップを閉じる処理
          document.getElementById("popup-close").onclick = () => {
            popup.style.display = "none";
            this.fishCaught = false;
            if (this.fishes.length === 0) {
              alert("ここのドブ川にはもう魚はいないようだ・・・次の川にいこう");
              this.createFishes(8);
            }
          };
          socket.on("close_popup", () => {
            popup.style.display = "none";
            this.fishCaught = false;

            if (this.fishes.length === 0) {
              alert("ここのドブ川にはもう魚はいないようだ・・・次の川にいこう");
              this.createFishes(8);
            }
          });
        }
      } else {
        fish.x += fish.speed * fish.direction;
        if (fish.x < 0 || fish.x > window.innerWidth) fish.direction *= -1;

        // rarityが6の場合、Y座標をランダムに動かす
        if (fish.data.rarity === 6) {
          fish.y += (Math.random() - 0.5) * 20;
          fish.y = Math.max(200, Math.min(window.innerHeight - 100, fish.y)); // 上下限を設定
        }

        if (this.checkCollision(fish) && !this.fishCaught) {
          fish.caught = true; // 魚が釣り上げられる
        }
      }
      this.drawFish(fish);
    });

    this.drawLure();
    requestAnimationFrame(() => this.gameLoop());
  }
}
new FishingGame();
