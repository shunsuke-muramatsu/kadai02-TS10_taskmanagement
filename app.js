// この名前で、ブラウザの保存場所にタスクを入れる
// 前に保存したタスクも読み込めるようにする
const storageName = "simpleKanbanTasks";

// タスクを入れておく箱（配列）
let tasks = [];

// 今、編集中のタスク番号。編集していないときはnull
let editingTaskId = null;

// 保存したタスクをブラウザから取り出す
function loadTasks() {
  const savedText = localStorage.getItem(storageName);

  // 保存された文字があるときだけ、タスクリストに戻す
  if (savedText !== null) {
    tasks = JSON.parse(savedText);
  }
}

// 今のタスクリストをブラウザに保存する
function saveTasks() {
  const taskText = JSON.stringify(tasks);
  localStorage.setItem(storageName, taskText);
}

// 画面のタスクを全部並べ直す
function showTasks() {
  // 3つの列を空にする
  $("#todo-list").empty();
  $("#doing-list").empty();
  $("#done-list").empty();

  // 列ごとのタスク数を数える
  let todoCount = 0;
  let doingCount = 0;
  let doneCount = 0;

  // タスクを1つずつ見て、正しい列に入れる
  tasks.forEach(function (task) {
    const card = makeTaskCard(task);

    if (task.status === "todo") {
      $("#todo-list").append(card);
      todoCount = todoCount + 1;
    } else if (task.status === "doing") {
      $("#doing-list").append(card);
      doingCount = doingCount + 1;
    } else {
      $("#done-list").append(card);
      doneCount = doneCount + 1;
    }
  });

  // 数えた数を画面に出す
  $("#todo-count").text(todoCount);
  $("#doing-count").text(doingCount);
  $("#done-count").text(doneCount);

  // タスクがない列にはメッセージを出す
  if (todoCount === 0) {
    $("#todo-list").append('<p class="empty-message">タスクはありません</p>');
  }
  if (doingCount === 0) {
    $("#doing-list").append('<p class="empty-message">タスクはありません</p>');
  }
  if (doneCount === 0) {
    $("#done-list").append('<p class="empty-message">タスクはありません</p>');
  }
}

// タスク1つ分のカードを作る
function makeTaskCard(task) {
  const card = $("<article>");
  card.addClass("task-card");
  card.attr("data-id", task.id);

  // タスク名とメモをカードに入れる
  const title = $("<h3>").text(task.title);
  const detail = $("<p>").text(task.detail || "メモはありません");
  const buttons = $("<div>").addClass("card-buttons");

  // 「次へ」ボタンで、タスクを次の列へ動かす
  if (task.status === "todo") {
    const nextButton = $("<button>").text("次へ →");
    nextButton.attr("type", "button");
    nextButton.on("click", function () {
      task.status = "doing";
      saveTasks();
      showTasks();
    });
    buttons.append(nextButton);
  } else if (task.status === "doing") {
    const nextButton = $("<button>").text("次へ →");
    nextButton.attr("type", "button");
    nextButton.on("click", function () {
      task.status = "done";
      saveTasks();
      showTasks();
    });
    buttons.append(nextButton);
  }

  // 「戻す」ボタンで、タスクを前の列へ戻す
  if (task.status === "doing") {
    const backButton = $("<button>").text("← 戻す");
    backButton.attr("type", "button");
    backButton.addClass("secondary-button");
    backButton.on("click", function () {
      task.status = "todo";
      saveTasks();
      showTasks();
    });
    buttons.append(backButton);
  } else if (task.status === "done") {
    const backButton = $("<button>").text("← 戻す");
    backButton.attr("type", "button");
    backButton.addClass("secondary-button");
    backButton.on("click", function () {
      task.status = "doing";
      saveTasks();
      showTasks();
    });
    buttons.append(backButton);
  }

  // 「編集」ボタンで、フォームに今の内容を入れる
  const editButton = $("<button>").text("編集");
  editButton.attr("type", "button");
  editButton.addClass("edit-button");
  editButton.on("click", function () {
    editingTaskId = task.id;
    $("#task-title").val(task.title);
    $("#task-detail").val(task.detail);
    $("#form-title").text("タスクを編集");
    $("#save-button").text("変更を保存");
    $("#cancel-edit-button").prop("hidden", false);
    $("#task-title").trigger("focus");
  });
  buttons.append(editButton);

  // 「削除」ボタンで、このタスクをリストから消す
  const deleteButton = $("<button>").text("削除");
  deleteButton.attr("type", "button");
  deleteButton.addClass("delete-button");
  deleteButton.on("click", function () {
    const shouldDelete = confirm("このタスクを削除しますか？");

    if (shouldDelete) {
      // 同じ番号のタスクを探して、リストから取り除く
      for (let i = 0; i < tasks.length; i = i + 1) {
        if (tasks[i].id === task.id) {
          tasks.splice(i, 1);
          break;
        }
      }

      // 編集中のタスクを消したなら、フォームも空にする
      if (editingTaskId === task.id) {
        resetForm();
      }

      saveTasks();
      showTasks();
      $("#message").text("タスクを削除しました。");
    }
  });
  buttons.append(deleteButton);

  // カードに、名前・メモ・ボタンを入れる
  card.append(title);
  card.append(detail);
  card.append(buttons);

  return card;
}

// 入力フォームを最初の状態に戻す
function resetForm() {
  editingTaskId = null;
  $("#task-form")[0].reset();
  $("#form-title").text("タスクを追加");
  $("#save-button").text("タスクを追加");
  $("#cancel-edit-button").prop("hidden", true);
}

// 追加ボタンが押されたときの動き
$("#task-form").on("submit", function (event) {
  // ブラウザがページを読み直すのを止める
  event.preventDefault();

  const title = $("#task-title").val().trim();
  const detail = $("#task-detail").val().trim();

  // タスク名が空なら、ここで止める
  if (title === "") {
    $("#message").text("タスク名を入力してください。");
    return;
  }

  if (editingTaskId === null) {
    // 新しいタスクを作って、タスクリストに入れる
    const newTask = {
      id: Date.now(),
      title: title,
      detail: detail,
      status: "todo"
    };
    tasks.push(newTask);
    $("#message").text("タスクを追加しました。");
  } else {
    // 編集中のタスクを探して、名前とメモを書きかえる
    for (let i = 0; i < tasks.length; i = i + 1) {
      if (tasks[i].id === editingTaskId) {
        tasks[i].title = title;
        tasks[i].detail = detail;
        break;
      }
    }
    $("#message").text("タスクを更新しました。");
  }

  // 変更を保存して、画面を更新する
  saveTasks();
  showTasks();
  resetForm();
});

// 編集をやめるボタンが押されたときの動き
$("#cancel-edit-button").on("click", function () {
  resetForm();
  $("#message").text("編集をやめました。");
});

// ページを開いたときに、保存したタスクを出す
loadTasks();
showTasks();
