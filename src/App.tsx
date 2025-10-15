import React, { useState, useEffect } from "react";
import { Waves, Play, Hand, HelpCircle } from "lucide-react";
/**
 * Mảng đại diện vị trí của mỗi đối tượng: [Sói, Dê, Bắp cải, Lái đò]
 * Giá trị: 1 = Bờ 1 (bờ bên trái), 2 = Bờ 2 (bờ bên phải)
 *
 * Trạng thái ban đầu: Tất cả đều ở Bờ 1
 * [1, 1, 1, 1] nghĩa là:
 *   - state[0] = 1: Sói ở Bờ 1
 *   - state[1] = 1: Dê ở Bờ 1
 *   - state[2] = 1: Bắp cải ở Bờ 1
 *   - state[3] = 1: Lái đò ở Bờ 1
 */
const INITIAL_STATE = [1, 1, 1, 1];

/**
 * 🎯 TRẠNG THÁI ĐÍCH
 *
 * Mục tiêu: Đưa tất cả sang Bờ 2
 * [2, 2, 2, 2] nghĩa là:
 *   - state[0] = 2: Sói ở Bờ 2
 *   - state[1] = 2: Dê ở Bờ 2
 *   - state[2] = 2: Bắp cải ở Bờ 2
 *   - state[3] = 2: Lái đò ở Bờ 2
 */
const GOAL_STATE = [2, 2, 2, 2];

interface Action {
  name: string; // Tên hành động (VD: "Chở Dê", "Lái đò một mình")
  newState: number[]; // Trạng thái mới sau khi thực hiện action
  items: string[]; // Danh sách vật được chở (VD: ['goat'], ['wolf'])
}

/**
 * Kiểm tra các trạng thái an toàn
 *
 * @param {number[]} state - Trạng thái cần kiểm tra [wolf, goat, cabbage, farmer]
 * @returns {boolean} - true nếu trạng thái an toàn, false nếu nguy hiểm
 *
 * Ràng buộc
 * 1. Sói và Dê KHÔNG được ở cùng bờ mà KHÔNG có Lái đò
 *    → Nếu wolf === goat && wolf !== farmer → Nguy hiểm (Sói ăn Dê)
 *
 * 2. Dê và Bắp cải KHÔNG được ở cùng bờ mà KHÔNG có Lái đò
 *    → Nếu goat === cabbage && goat !== farmer → Nguy hiểm (Dê ăn Bắp cải)
 *
 * Đọ phức tạp
 * - Thời gian: O(1) - Chỉ có 2 phép so sánh
 * - Không gian: O(1) - Không dùng bộ nhớ phụ
 *
 * 💡 VÍ DỤ:
 * - isSafeState([1, 1, 2, 2]) → false (Sói và Dê cùng Bờ 1, Lái đò ở Bờ 2)
 * - isSafeState([1, 2, 2, 2]) → true (Mỗi bờ đều an toàn)
 */
const isSafeState = (state: number[]): boolean => {
  const [wolf, goat, cabbage, farmer] = state;

  // Sói + Dê = false (nếu không có Lái đò)
  // Kiểm tra ràng buộc #1: Sói - Dê
  if (wolf === goat && wolf !== farmer) {
    return false; // Nguy hiểm: Sói sẽ ăn Dê
  }

  // Dê + Bắp cải = false (nếu không có Lái đò)
  // Kiểm tra ràng buộc #2: Dê - Bắp cải
  if (goat === cabbage && goat !== farmer) {
    return false; // Nguy hiểm: Dê sẽ ăn Bắp cải
  }

  return true; // ✅ Trạng thái an toàn
};

/**
 * @param {number[]} s1 - Trạng thái thứ nhất
 * @param {number[]} s2 - Trạng thái thứ hai
 * @returns {boolean} - true nếu hai trạng thái giống hệt nhau
 *
 * 📊 ĐỘ PHỨC TẠP:
 * - Thời gian: O(n) với n = 4 phần tử → O(1) trong trường hợp này
 * - Không gian: O(1)
 *
 * 💡 VÍ DỤ:
 * - statesEqual([1,1,1,1], [1,1,1,1]) → true
 * - statesEqual([1,1,1,1], [2,2,2,2]) → false
 */
const statesEqual = (s1: number[], s2: number[]): boolean => {
  return s1.every((val, idx) => val === s2[idx]);
};

/**
 * @param {number[]} state - Trạng thái hiện tại
 * @returns {Action[]} - Mảng các action hợp lệ (đã được lọc an toàn)
 *
 * CÁC HÀNH ĐỘNG CÓ THỂ:
 * 1. Lái đò đi một mình (farmer thay đổi bờ)
 * 2. Lái đò chở Sói (wolf và farmer cùng thay đổi bờ)
 * 3. Lái đò chở Dê (goat và farmer cùng thay đổi bờ)
 * 4. Lái đò chở Bắp cải (cabbage và farmer cùng thay đổi bờ)
 *
 * ĐIỀU KIỆN:
 * - Chỉ chở được vật cùng bờ với Lái đò
 * - Chỉ giữ lại các action dẫn đến trạng thái AN TOÀN
 *
 * 📊 ĐỘ PHỨC TẠP:
 * - Thời gian: O(1) - Có tối đa 4 hành động, mỗi action O(1) để check
 * - Không gian: O(1) - Trả về tối đa 4 phần tử
 */
const getValidActions = (state: number[]): Action[] => {
  const [wolf, goat, cabbage, farmer] = state;
  const actions: Action[] = [];

  // Hành độg 1: Lái đò đi một mình
  // Điều kiện: Luôn có thể thực hiện (không cần check)
  // Chỉ farmer chuyển bờ (1→2 hoặc 2→1)
  actions.push({
    name: "Lái đò một mình",
    newState: [wolf, goat, cabbage, farmer === 1 ? 2 : 1],
    items: [], // Không chở gì
  });

  // Sói hành động 2: Lái đò chở Sói
  // Điều kiện: Sói phải cùng bờ với Lái đò (wolf === farmer)
  // Cả wolf và farmer cùng chuyển bờ
  if (wolf === farmer) {
    actions.push({
      name: "Chở Sói",
      newState: [wolf === 1 ? 2 : 1, goat, cabbage, farmer === 1 ? 2 : 1],
      items: ["wolf"],
    });
  }

  // Dê hành động 3: Lái đò chở Dê
  // Điều kiện: Dê phải cùng bờ với Lái đò (goat === farmer)
  // Cả goat và farmer cùng chuyển bờ
  if (goat === farmer) {
    actions.push({
      name: "Chở Dê",
      newState: [wolf, goat === 1 ? 2 : 1, cabbage, farmer === 1 ? 2 : 1],
      items: ["goat"],
    });
  }

  // Bắp cải hành động 4: Lái đò chở Bắp cải
  // Điều kiện: Bắp cải phải cùng bờ với Lái đò (cabbage === farmer)
  // Cả cabbage và farmer cùng chuyển bờ
  if (cabbage === farmer) {
    actions.push({
      name: "Chở Bắp cải",
      newState: [wolf, goat, cabbage === 1 ? 2 : 1, farmer === 1 ? 2 : 1],
      items: ["cabbage"],
    });
  }

  // Loại bỏ những action dẫn đến trạng thái nguy hiểm
  return actions.filter((action) => isSafeState(action.newState));
};

/**
 *BFS
 * Mục tiêu:
 * - Tìm chuỗi hành động NGẮN NHẤT để đưa từ trạng thái ban đầu → trạng thái đích
 * - Đảm bảo tìm được đường đi tối ưu (ít bước nhất)
 *
 * Nguyên lý hoạt động:
 * 1. Sử dụng Queue (hàng đợi - FIFO) để duyệt các trạng thái
 * 2. Duyệt từng "tầng" một (tất cả trạng thái cách 1 bước, rồi 2 bước, ...)
 * 3. Sử dụng Set để lưu các trạng thái đã thăm (tránh lặp lại)
 * 4. Dừng ngay khi tìm thấy trạng thái đích → Đảm bảo đường đi ngắn nhất
 *
 * Độ phức tạp:
 * - Thời gian: O(V + E)
 *   + V = số trạng thái (vertices) ≈ 2^4 = 16 trạng thái có thể
 *   + E = số cạnh (edges) ≈ 4V = 64 kết nối tối đa
 *   + Thực tế chỉ ~10 trạng thái hợp lệ → Rất nhanh!
 *
 * - Không gian: O(V)
 *   + Queue: O(V) trong worst case
 *   + Visited Set: O(V)
 *   + Total: O(V) ≈ O(10) → Rất nhẹ!
 *
 * - Queue: [[state, path], [state, path], ...]
 *   + state: Trạng thái hiện tại
 *   + path: Mảng các action để đến trạng thái này
 *
 * - Visited Set: {"[1,1,1,1]", "[1,2,1,2]", ...}
 *   + Dùng JSON.stringify để convert array → string key
 *   + Set cho phép lookup O(1)
 *
 * Bước 0: Queue = [[[1,1,1,1], []]]
 *          Visited = {"[1,1,1,1]"}
 *
 * Bước 1: Lấy [1,1,1,1], thử 4 action
 *          → Thêm các trạng thái mới vào Queue
 *          Queue = [[[1,2,1,2], [action1]], [[2,1,1,2], [action2]], ...]
 *
 * Bước 2: Lấy [1,2,1,2], thử các action tiếp...
 *
 * Bước N: Tìm thấy [2,2,2,2] → Return path!
 */
const findSolution = (startState: number[]): Action[] | null => {
  // Queue chứa các phần tử dạng: [trạng thái hiện tại, đường đi để đến đây]
  const queue: [number[], Action[]][] = [[startState, []]];

  // Set lưu các trạng thái đã thăm (dùng string làm key)
  const visited = new Set<string>();
  visited.add(JSON.stringify(startState));

  while (queue.length > 0) {
    //Lấy phần tử đầu tiên trong Queue
    const [currentState, path] = queue.shift()!;

    // Nếu đã đến đích → Trả về lời giải
    if (statesEqual(currentState, GOAL_STATE)) {
      return path; //Tìm thấy lời giải!
    }

    const actions = getValidActions(currentState);

    // Duyệt qua từng hành động
    for (const action of actions) {
      // Tạo key cho trạng thái mới
      const stateKey = JSON.stringify(action.newState);

      // Chỉ xử lý nếu chưa thăm
      if (!visited.has(stateKey)) {
        // Đánh dấu đã thăm (để không quay lại)
        visited.add(stateKey);

        //Thêm vào Queue để xử lý sau
        queue.push([
          action.newState, // Trạng thái mới
          [...path, action], // Đường đi mới = đường đi cũ + action hiện tại
        ]);
      }
    }
  }

  return null;
};

/**
 * Component này cung cấp 3 chế độ chơi:
 * 1. Auto (Máy tự chơi): Hiển thị lời giải tối ưu với animation
 * 2. Manual (Người chơi): Người dùng tự chọn action để chơi
 * 3. Assisted (Máy trợ giúp): Người chơi + có nút gợi ý
 *
 
 * - mode: Chế độ chơi hiện tại
 * - state: Trạng thái game hiện tại
 * - solution: Lời giải tìm được bởi BFS
 * - currentStep: Bước hiện tại trong chế độ auto
 * - isPlaying: Đang tự động chơi hay không
 * - message: Thông báo hiển thị cho người dùng
 * - history: Lịch sử các trạng thái (cho undo nếu cần)
 */
const FerrymanPuzzle = () => {
  /**
   * - 'auto': Máy tự động giải và hiển thị
   * - 'manual': Người chơi tự chọn action
   * - 'assisted': Người chơi + có nút gợi ý
   */
  const [mode, setMode] = useState<"auto" | "manual" | "assisted">("auto");

  /**
   * Trạng thái game hiện tại
   * Mảng [Sói, Dê, Bắp cải, Lái đò]
   * Mỗi giá trị: 1 (Bờ 1) hoặc 2 (Bờ 2)
   */
  const [state, setState] = useState<number[]>(INITIAL_STATE);
  const [solution, setSolution] = useState<Action[] | null>(null);
  const [currentStep, setCurrentStep] = useState(0);

  /**
   * Đang auto-play hay không
   * true: Đang tự động chơi
   * false: Đã dừng hoặc chưa bắt đầu
   */
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState("");

  /**
   * Lịch sử các trạng thái
   * Mảng các state đã đi qua (dùng cho undo nếu cần)
   */
  const [history, setHistory] = useState<number[][]>([INITIAL_STATE]);
  /**
   * Tính lời giải khi component mount
   * Chạy 1 lần khi component được render lần đầu
   * Tính toán lời giải bằng BFS và lưu vào state
   * Dependencies: [] → Chỉ chạy 1 lần
   */
  useEffect(() => {
    const sol = findSolution(INITIAL_STATE);
    setSolution(sol);
  }, []);

  /**
   * Auto-play animation
   * Chạy mỗi khi các dependencies thay đổi
   * Nếu đang ở chế độ auto và isPlaying = true:
   * - Mỗi 1.5 giây thực hiện 1 bước
   * - Cập nhật state theo action trong solution
   * - Tăng currentStep
   * - Dừng khi hết solution
   * Dependencies: [isPlaying, currentStep, solution, mode]
   * Cleanup: Clear timeout khi component unmount hoặc dependencies thay đổi
   */
  useEffect(() => {
    // ✅ Điều kiện để chạy auto-play
    const shouldRun =
      mode === "auto" && // Phải ở chế độ auto
      isPlaying && // Phải đang play
      solution && // Phải có lời giải
      currentStep < solution.length; // Chưa hết bước

    if (shouldRun) {
      const timer = setTimeout(() => {
        const action = solution[currentStep];
        setState(action.newState);
        setCurrentStep(currentStep + 1);
        if (currentStep + 1 === solution.length) {
          setIsPlaying(false); // Dừng auto-play
          setMessage("🎉 Hoàn thành! Tất cả đã qua sông an toàn!");
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, currentStep, solution, mode]);

  const reset = () => {
    setState(INITIAL_STATE);
    setCurrentStep(0);
    setIsPlaying(false);
    setMessage("");
    setHistory([INITIAL_STATE]);
  };

  const startAutoPlay = () => {
    reset();
    setIsPlaying(true);
    setMessage("Máy đang giải bài toán...");
  };

  /**
   * Xử lý hành động của người chơi
   * Được gọi khi người dùng click vào một action button
   * trong chế độ Manual hoặc Assisted
   *
   * Luồng xử lý:
   * 1. Validate: Kiểm tra action có an toàn không (double-check)
   * 2. Update State: Cập nhật state mới
   * 3. Save History: Lưu vào history
   * 4. Check Win: Kiểm tra đã thắng chưa
   * 5. Show Message: Hiển thị thông báo tương ứng
   */
  const handleManualAction = (action: Action) => {
    //  Double-check an toàn
    if (!isSafeState(action.newState)) {
      setMessage("⚠️ Hành động này không an toàn!");
      return;
    }

    // Cập nhật trạng thái
    setState(action.newState);

    // Lưu vào lịch sử
    setHistory([...history, action.newState]);

    // Kiểm tra thắng
    if (statesEqual(action.newState, GOAL_STATE)) {
      setMessage("🎉 Chúc mừng! Bạn đã hoàn thành!");
    } else {
      setMessage("");
    }
  };

  /**
   * Gợi ý bước tiếp theo
   * Được gọi khi người dùng click "Xin gợi ý" trong chế độ Assisted
   * Hoạt động:
   * 1. Chạy BFS từ trạng thái HIỆN TẠI (không phải từ đầu)
   * 2. Nếu tìm thấy lời giải → Gợi ý bước đầu tiên
   * 3. Nếu không tìm thấy → Người chơi đã đi vào deadlock
   */
  const getHint = () => {
    // Tìm lời giải từ trạng thái hiện tại
    const sol = findSolution(state);

    if (!sol || sol.length === 0) {
      //Không tìm thấy lời giải (có thể đã ở đích hoặc trạng thái lỗi)
      setMessage("Không thể hoàn thành từ trạng thái này!");
    } else {
      // Gợi ý bước đầu tiên
      setMessage(`💡 Gợi ý: ${sol[0].name}`);
    }
  };

  const renderEntity = (side: number) => {
    const [wolf, goat, cabbage, farmer] = state;
    const isOnSide = (entitySide: number) => entitySide === side;
    const entities = [
      { show: isOnSide(wolf), emoji: "🐺", label: "Sói" },
      { show: isOnSide(goat), emoji: "🐐", label: "Dê" },
      { show: isOnSide(cabbage), emoji: "🥬", label: "Bắp cải" },
      { show: isOnSide(farmer), emoji: "👨‍🌾", label: "Lái đò" },
    ];
    return (
      <div className="flex flex-wrap gap-4 justify-center items-center min-h-32">
        {entities.map(
          (entity, idx) =>
            entity.show && (
              <div key={idx} className="flex flex-col items-center">
                {/* Emoji lớn */}
                <div className="text-5xl">{entity.emoji}</div>
                {/* Label nhỏ */}
                <span className="text-sm mt-1 font-medium">{entity.label}</span>
              </div>
            )
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-pink-50 to-rose-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-6 md:mb-8 text-rose-700">
          🚣 Bài toán Người lái đò
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6">
          <h2 className="text-lg md:text-xl font-semibold mb-4">
            Chọn chế độ chơi:
          </h2>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => {
                setMode("auto");
                reset();
              }}
              className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition ${
                mode === "auto"
                  ? "bg-pink-500 text-white"
                  : "bg-pink-100 text-pink-700 hover:bg-pink-200"
              }`}
            >
              <Play size={20} />
              <span className="text-sm md:text-base">Máy tự chơi</span>
            </button>

            <button
              onClick={() => {
                setMode("manual");
                reset();
              }}
              className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition ${
                mode === "manual"
                  ? "bg-rose-500 text-white"
                  : "bg-pink-100 text-pink-700 hover:bg-pink-200"
              }`}
            >
              <Hand size={20} />
              <span className="text-sm md:text-base">Người chơi</span>
            </button>

            <button
              onClick={() => {
                setMode("assisted");
                reset();
              }}
              className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-medium transition ${
                mode === "assisted"
                  ? "bg-pink-600 text-white"
                  : "bg-pink-100 text-pink-700 hover:bg-pink-200"
              }`}
            >
              <HelpCircle size={20} />
              <span className="text-sm md:text-base">Máy trợ giúp</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="bg-pink-50 rounded-lg p-4 md:p-6 border-4 border-pink-400">
              <h3 className="text-center font-bold mb-4 text-pink-700">
                Bờ 1 (Ban đầu)
              </h3>
              {renderEntity(1)}
            </div>

            <div className="flex flex-col items-center justify-center py-6 md:py-0">
              <Waves size={48} className="text-pink-400 animate-pulse mb-4" />
              <div className="text-center">
                <div className="text-5xl md:text-6xl">🚣</div>
                <p className="text-xs md:text-sm text-gray-600 mt-2">
                  {state[3] === 1 ? "← Thuyền ở Bờ 1" : "Thuyền ở Bờ 2 →"}
                </p>
              </div>
            </div>

            <div className="bg-rose-50 rounded-lg p-4 md:p-6 border-4 border-rose-400">
              <h3 className="text-center font-bold mb-4 text-rose-700">
                Bờ 2 (Đích)
              </h3>
              {renderEntity(2)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          {mode === "auto" && (
            <div className="text-center">
              <button
                onClick={startAutoPlay}
                disabled={isPlaying}
                className="px-6 md:px-8 py-3 md:py-4 bg-pink-500 text-white rounded-lg font-medium hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition text-sm md:text-base"
              >
                {isPlaying ? "Đang chơi..." : "Bắt đầu tự động"}
              </button>
            </div>
          )}

          {(mode === "manual" || mode === "assisted") && (
            <div>
              <h3 className="font-semibold mb-4 text-sm md:text-base">
                Chọn hành động:
              </h3>

              <div className="flex flex-wrap gap-2 md:gap-3 mb-4">
                {getValidActions(state).map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleManualAction(action)}
                    className="px-3 md:px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition text-sm md:text-base"
                  >
                    {action.name}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 md:gap-4 flex-wrap">
                <button
                  onClick={reset}
                  className="px-4 md:px-6 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition text-sm md:text-base"
                >
                  Chơi lại
                </button>

                {mode === "assisted" && (
                  <button
                    onClick={getHint}
                    className="px-4 md:px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition text-sm md:text-base"
                  >
                    Xin gợi ý
                  </button>
                )}
              </div>
            </div>
          )}

          {message && (
            <div className="mt-6 p-4 bg-pink-50 border border-pink-300 rounded-lg text-center">
              <p className="text-base md:text-lg font-medium">{message}</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mt-6">
          <h3 className="font-bold text-base md:text-lg mb-3">📜 Luật chơi:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700 text-sm md:text-base">
            <li>
              Thuyền chỉ chở tối đa 2 khách (lái đò + 1 vật hoặc lái đò đi một
              mình)
            </li>
            <li>⚠️ KHÔNG để Sói và Dê ở cùng bờ mà không có Lái đò</li>
            <li>⚠️ KHÔNG để Dê và Bắp cải ở cùng bờ mà không có Lái đò</li>
            <li>🎯 Mục tiêu: Đưa tất cả sang Bờ 2 an toàn</li>
          </ul>
        </div>

        {solution && (
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mt-6">
            <h3 className="font-bold text-base md:text-lg mb-3">
              ℹ️ Thông tin:
            </h3>
            <p className="text-gray-700 text-sm md:text-base">
              Số bước tối thiểu để hoàn thành:{" "}
              <span className="font-bold text-rose-600">{solution.length}</span>{" "}
              bước
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FerrymanPuzzle;
