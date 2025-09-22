import { useState } from "react";
import "./App.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Triangle = [number, number, number];
type Interval = [number, number];
type Trapeze = [number, number, number, number];

function App() {
  const INITIAL_LINGUISTIC_TERMS: Record<string, Triangle> = {
    "Дуже низький": [0, 0, 1],
    Низький: [0, 1, 2],
    Середній: [2, 3, 4],
    Високий: [4, 5, 6],
    "Дуже високий": [6, 7, 8],
  };

  const DEFAULT_CRITERIA = [
    "Дизайн",
    "Популярність",
    "Ціна",
    "Ємність батареї",
    "Камера",
    "Продуктивність",
    "Пам'ять",
    "Дисплей",
  ];

  const DEFAULT_ALTERNATIVES = [
    "Iphone 17",
    "Samsung Galaxy S25FE",
    "Xiaomi Redmi Note 14 PRO",
    "Nothing Phone",
    "Oppo",
  ];

  const defaultWeights = Array(DEFAULT_CRITERIA.length).fill(
    1 / DEFAULT_CRITERIA.length
  );

  const addTriangles = (t1: Triangle, t2: Triangle): Triangle => [
    t1[0] + t2[0],
    t1[1] + t2[1],
    t1[2] + t2[2],
  ];

  const scaleTriangle = (t: Triangle, k: number): Triangle => [
    t[0] * k,
    t[1] * k,
    t[2] * k,
  ];

  const triangleCentroid = (t: Triangle) => (t[0] + t[1] + t[2]) / 3;

  const triangleToInterval = (t: Triangle): Interval => [t[0], t[2]];

  const triangleToTrapeze = (t: Triangle): Trapeze => {
    const [a, b, c] = t;
    const delta = (c - a) / 2;
    return [a, b, b, a + delta * 2];
  };

  const getTriangleData = (t: Triangle) => [
    { x: t[0], y: 0 },
    { x: t[1], y: 1 },
    { x: t[2], y: 0 },
  ];

  const [criteria, _] = useState(DEFAULT_CRITERIA);
  const [alternatives, setAlternatives] = useState(DEFAULT_ALTERNATIVES);
  const [weights, setWeights] = useState(defaultWeights);
  const [linguisticTerms, setLinguisticTerms] = useState(
    INITIAL_LINGUISTIC_TERMS
  );
  const [ratings, setRatings] = useState(() => {
    const terms = Object.keys(INITIAL_LINGUISTIC_TERMS);
    return alternatives.map(() =>
      criteria.map(() => terms[Math.floor(Math.random() * terms.length)])
    );
  });
  const [lpr, setLpr] = useState<string>("neutral");
  const [newAlternative, setNewAlternative] = useState<string>("");
  const [showIntervals, setShowIntervals] = useState<boolean>(false);
  const [showTrapeze, setShowTrapeze] = useState<boolean>(false);

  const [newTermName, setNewTermName] = useState<string>("");
  const [newTriA, setNewTriA] = useState<string>("0");
  const [newTriB, setNewTriB] = useState<string>("0");
  const [newTriC, setNewTriC] = useState<string>("0");

  const addAlternative = () => {
    if (!newAlternative.trim()) return alert("Назва не може бути порожньою");
    if (alternatives.includes(newAlternative))
      return alert("Альтернатива вже існує");

    setAlternatives([...alternatives, newAlternative]);
    const terms = Object.keys(linguisticTerms);
    const newRatingsRow = criteria.map(
      () => terms[Math.floor(Math.random() * terms.length)]
    );
    setRatings([...ratings, newRatingsRow]);
    setNewAlternative("");
  };

  const addLinguisticTerm = (name: string, tri: Triangle) => {
    if (!name.trim()) return alert("Коротке ім’я обов’язкове");
    if (linguisticTerms[name]) return alert("ЛТ з таким ім’ям вже існує");
    if (tri[0] > tri[1] || tri[1] > tri[2])
      return alert("Невірне значення трикутного числа");
    setLinguisticTerms((prev) => ({ ...prev, [name]: tri }));
    setNewTermName("");
    setNewTriA("0");
    setNewTriB("0");
    setNewTriC("0");
  };

  const normalizeTriangles = () => {
    const allValues = Object.values(linguisticTerms).flat();
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const normalized: Record<string, Triangle> = {};
    for (let key in linguisticTerms) {
      const t = linguisticTerms[key];
      normalized[key] = [
        (t[0] - minVal) / (maxVal - minVal),
        (t[1] - minVal) / (maxVal - minVal),
        (t[2] - minVal) / (maxVal - minVal),
      ];
    }
    setLinguisticTerms(normalized);
  };

  const setRating = (altIndex: number, critIndex: number, term: string) => {
    const newRatings = ratings.map((row) => row.slice());
    newRatings[altIndex][critIndex] = term;
    setRatings(newRatings);
  };

  const setWeight = (i: number, value: string) => {
    const arr = weights.slice();
    arr[i] = Number(value);
    const sum = arr.reduce((s, x) => s + x, 0) || 1;
    for (let k = 0; k < arr.length; k++) arr[k] = arr[k] / sum;
    setWeights(arr);
  };

  const aggregateAlternative = (altIndex: number): Triangle => {
    let agg: Triangle = [0, 0, 0];
    for (let j = 0; j < criteria.length; j++) {
      const termName = ratings[altIndex][j];
      const tri = linguisticTerms[termName];
      const scaled = scaleTriangle(tri, weights[j]);
      agg = addTriangles(agg, scaled);
    }
    return agg;
  };

  const scoreFromLpr = (tri: Triangle) => {
    if (lpr === "pessimistic") return tri[0];
    if (lpr === "optimistic") return tri[2];
    return triangleCentroid(tri);
  };

  const computeRankings = () => {
    const results = alternatives.map((alt, i) => {
      const agg = aggregateAlternative(i);
      const score = scoreFromLpr(agg);
      return { alt, agg, score };
    });
    return results.sort((a, b) => b.score - a.score);
  };

  const rankings = computeRankings();



  return (
    <div className="w-full h-auto flex justify-center items-center">
      <div className="w-fit h-auto p-8">
        <h1 className="text-lg font-bold text-gray-500 mb-4">
          Вибір найкращого смартфона з використанням нечітких оцінок
        </h1>

        {/* Форма додавання альтернатив */}
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Додати альтернативу</h2>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Назва альтернативи"
              value={newAlternative}
              onChange={(e) => setNewAlternative(e.target.value)}
              className="border p-2 rounded w-full"
            />
            <button
              onClick={addAlternative}
              className="px-3 py-2 bg-black text-white rounded hover:cursor-pointer"
            >
              Додати
            </button>
          </div>
        </div>

        {/* Форма додавання нової ЛТ */}
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Додати новий ЛТ</h2>
          <div className="flex flex-col md:flex-row gap-2 items-center">
            <input
              type="text"
              placeholder="Назва ЛТ"
              value={newTermName}
              onChange={(e) => setNewTermName(e.target.value)}
              className="border p-2 rounded w-full md:w-1/4"
            />
            <input
              type="number"
              placeholder="a"
              value={newTriA}
              onChange={(e) => setNewTriA(e.target.value)}
              className="border p-2 rounded w-full md:w-1/6"
            />
            <input
              type="number"
              placeholder="b"
              value={newTriB}
              onChange={(e) => setNewTriB(e.target.value)}
              className="border p-2 rounded w-full md:w-1/6"
            />
            <input
              type="number"
              placeholder="c"
              value={newTriC}
              onChange={(e) => setNewTriC(e.target.value)}
              className="border p-2 rounded w-full md:w-1/6"
            />
            <button
              onClick={() =>
                addLinguisticTerm(newTermName, [+newTriA, +newTriB, +newTriC])
              }
              className="px-3 py-2 bg-black text-white rounded hover:cursor-pointer"
            >
              Додати ЛТ
            </button>
          </div>
        </div>

        {/* Таблиця трикутних оцінок */}
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 border-none rounded-2xl max-w-5xl">
            <thead className="text-gray-700">
              <tr>
                <th className="p-2">Смартфон</th>
                {criteria.map((c) => (
                  <th key={c} className="px-2 uppercase">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alternatives.map((alt, i) => (
                <tr key={alt} className="w-fit">
                  <td className="p-2 font-medium">{alt}</td>
                  {criteria.map((_, j) => (
                    <td key={j} className="p-2">
                      <select
                        value={ratings[i][j]}
                        onChange={(e) => setRating(i, j, e.target.value)}
                        className="select"
                      >
                        {Object.keys(linguisticTerms).map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ваги и ЛПР */}
        <div className="mb-6 p-4 border rounded">
          <h3 className="font-semibold mb-2">Ваги критеріїв (нормовані)</h3>
          {criteria.map((c, i) => (
            <div key={c} className="mb-2">
              <label className="text-sm block mb-1">
                {c} — {weights[i].toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={weights[i]}
                onChange={(e) => setWeight(i, e.target.value)}
                className="range range-neutral"
              />
            </div>
          ))}
          <div className="mt-4">
            <label className="block mb-1">
              Позиція Людини яка приймає рішення
            </label>
            <select
              value={lpr}
              onChange={(e) => setLpr(e.target.value)}
              className="select"
            >
              <option value="pessimistic">Песимістична (ліва межа)</option>
              <option value="neutral">Нейтральна (центроїд)</option>
              <option value="optimistic">Оптимістична (права межа)</option>
            </select>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={normalizeTriangles} className="btn btn-primary">
              Normalize ЛТ
            </button>
            <button
              onClick={() => setShowIntervals(!showIntervals)}
              className="btn btn-primary"
            >
              {showIntervals
                ? "Показати треугольні ЛТ"
                : "Показати інтервальні оцінки"}
            </button>
            <button
              onClick={() => setShowTrapeze(!showTrapeze)}
              className="btn btn-primary"
            >
              {showTrapeze
                ? "Показати треугольні ЛТ"
                : "Показати трапецiйнi ЛТ"}
            </button>
          </div>
        </div>

        {/* Інтервальні оцінки */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Інтервальні оцінки</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 border-none rounded-2xl max-w-5xl">
              <thead className="text-gray-700">
                <tr>
                  <th className="p-2">Смартфон</th>
                  {criteria.map((c) => (
                    <th key={c} className="px-2 uppercase">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alternatives.map((alt, i) => (
                  <tr key={alt} className="w-fit">
                    <td className="p-2 font-medium">{alt}</td>
                    {criteria.map((_, j) => {
                      const tri = linguisticTerms[ratings[i][j]];
                      if (showTrapeze) {
                        const trap = triangleToTrapeze(tri);
                        return (
                          <td key={j} className="p-2">
                            [{trap.map((x) => x.toFixed(2)).join(", ")}]
                          </td>
                        );
                      }
                      if (showIntervals) {
                        const interval = triangleToInterval(tri);
                        return (
                          <td key={j} className="p-2">
                            [{interval[0].toFixed(2)}, {interval[1].toFixed(2)}]
                          </td>
                        );
                      }
                      return (
                        <td key={j} className="p-2">
                          [{tri.map((x) => x.toFixed(2)).join(", ")}]
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Результаты агрегирования */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">
            Агреговані значення та результати
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {rankings.map((r, idx) => (
              <div key={r.alt} className="p-3 border rounded">
                <div className="flex justify-between items-baseline">
                  <h3 className="font-semibold">
                    {idx + 1}. {r.alt}
                  </h3>
                  <div className="text-sm text-gray-600">
                    score: {r.score.toFixed(3)}
                  </div>
                </div>
                <div className="text-xs text-gray-700 mt-2">
                  {showIntervals ? (
                    <>
                      Інтервал: [{triangleToInterval(r.agg)[0].toFixed(3)},{" "}
                      {triangleToInterval(r.agg)[1].toFixed(3)}]
                    </>
                  ) : showTrapeze ? (
                    <>
                      Трапеційний ЛТ: [
                      {triangleToTrapeze(r.agg)
                        .map((x) => x.toFixed(3))
                        .join(", ")}
                      ]
                    </>
                  ) : (
                    <>
                      Агрегований трикутник: [
                      {r.agg.map((x) => x.toFixed(3)).join(", ")}]
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* График */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">Діаграма результатів</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" type="number" domain={[0, 8]} />
              <YAxis domain={[0, 1]} />
              <Tooltip />
              <Legend verticalAlign="top" align="right" height={36} />

              {Object.entries(linguisticTerms).map(([name, tri], idx) => (
                <Line
                  key={name}
                  type="linear"
                  data={getTriangleData(tri)}   // 👉 тут три точки из функции
                  dataKey="y"
                  name={name}
                  stroke={`hsl(${idx * 40}, 80%, 50%)`}
                  dot={{ r: 2 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default App;
