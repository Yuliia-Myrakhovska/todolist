///////////////////////
const dateInfo = new Date();
const dateCalendar = new Date(dateInfo.getTime());
const day = dateInfo.getDate();
const weekday = dateInfo.toLocaleString("uk-UA", {
  weekday: "long",
});
const month = dateInfo.toLocaleString("uk-UA", {
  month: "numeric",
});
const year = dateInfo.getFullYear();

function disableScroll() {
  document.body.style.overflow = "hidden";
}

function enableScroll() {
  document.body.style.overflow = "";
}

const db = new Dexie("todoList");

$(document).ready(async () => {
  await db.version(1).stores({
    cardinfo: "++id,titleCard,dateCard,ArrayList",
  });

  await db.open().catch((err) => {
    console.error("Ошибка при открытии базы данных:", err);
  });

  await sliderCardWatch();
});

async function sliderCardWatch() {
  if ($(".slider").hasClass("slick-initialized")) {
    $(".slider").slick("unslick");
  }

  if ($(".card-container > .card").length >= 1) {
    $(".card").each(function () {
      $(this).remove();
    });
  }

  await db.cardinfo
    .toCollection()
    .count()
    .then((count) => {
      if (count >= 1) {
        db.cardinfo.toArray().then((cardinfo) => {
          cardinfo.forEach((item, index) => {
            if (index >= 10) return;

            const card = $("<div></div>");
            index === 0
              ? card.addClass("card slide card-today")
              : card.addClass("card slide");
            const cardheader = $("<div></div>").addClass("card-header");
            const cardtitle = $("<div></div>")
              .addClass("card-title")
              .text(item.titleCard);
            const carddate = $("<div></div>")
              .addClass("card-date")
              .text(item.dateCard);
            const cardbody = $("<div></div>").addClass("card-body");
            const cardlist = $("<ul></ul>").addClass("card-list");

            $(".card-container")
              .removeClass("flex-img")
              .addClass("flex-card")
              .append(card);

            $(".card-container").find(".card-img").remove();

            card.append(cardheader);
            card.append(cardbody);
            cardheader.append(carddate).append(cardtitle);
            cardbody.append(cardlist);

            item.ArrayList.forEach((taskItem) => {
              const li = $("<li></li>");
              const taskCheckBox = $("<input/>")
                .addClass("task-input-checkbox")
                .attr("type", "checkbox")
                .attr("checked", taskItem.value)
                .attr("disabled", true);
              const taskInput = $("<p></p>")
                .addClass("task-input-text")
                .text(taskItem.name);
              if (taskItem.value) {
                taskInput
                  .css("text-decoration", "line-through")
                  .css("color", "gray");
              } else {
                taskInput.css("text-decoration", "none").css("color", "black");
              }
              li.append(taskCheckBox).append(taskInput);
              cardlist.append(li);
            });

            const path = "img/dist/drop.svg";
            const cardmore = $("<div></div>").addClass("card-more");
            const img = $("<img>")
              .addClass("card-more-icon")
              .attr("src", path)
              .attr("alt", "Більше");
            cardmore.append(img);
            card.append(cardmore);
          });

          $(".slider").slick({
            infinite: false,
            slidesToShow: 3,
            slidesToScroll: 1,
            variableWidth: true,
            responsive: [
              {
                breakpoint: 768,
                settings: {
                  slidesToShow: 1,
                },
              },
            ],
          });

          let img = $("<img/>").attr("src", "img/dist/right.svg");
          $(".slick-next").text("").append(img);
          img = $("<img/>").attr("src", "img/dist/left.svg");
          $(".slick-prev").text("").append(img);
        });
      } else {
        const path = "img/dist/Sandy_Edu-03_Single-02.jpg";
        const img = $("<img/>")
          .addClass("card-img")
          .attr("src", path)
          .attr("alt", "Додайте завдання");
        $(".card-container")
          .removeClass("flex-card")
          .addClass("flex-img")
          .append(img);
      }
    });
}

async function sliderData(titleModal) {
  await db.cardinfo
    .where("titleCard")
    .equals(`${titleModal}`)
    .each((cardinfo) => {
      $(".modal-popup .modal-date").text(cardinfo.dateCard);
      $(".modal-popup .modal-title").text(cardinfo.titleCard);

      const cardlist = $("<ul></ul>").addClass("modal-list");

      cardinfo.ArrayList.forEach((taskItem, index) => {
        const li = $("<li></li>");
        const taskCheckBox = $("<input/>")
          .addClass("task-input-checkbox")
          .attr("type", "checkbox")
          .attr("checked", taskItem.value);

        const taskInput = $("<p></p>")
          .addClass("task-input-text")
          .text(taskItem.name);

        if (taskItem.value) {
          taskInput.css("text-decoration", "line-through").css("color", "gray");
        }

        // Обработчик изменения состояния чекбокса
        taskCheckBox.on("change", async () => {
          const isChecked = !taskItem.value;

          if (isChecked) {
            taskInput
              .css("text-decoration", "line-through")
              .css("color", "gray");
          } else {
            taskInput.css("text-decoration", "none").css("color", "black");
          }

          const updatedArrayList = cardinfo.ArrayList.map((task, idx) => {
            if (idx === index) {
              return { ...task, value: isChecked };
            }
            return task;
          });

          try {
            await db.cardinfo.update(cardinfo.id, {
              ArrayList: updatedArrayList,
            });
            console.log("Значение успешно обновлено в базе данных.");
          } catch (error) {
            console.error("Ошибка обновления в базе данных:", error);
          }
        });

        li.append(taskCheckBox).append(taskInput);
        cardlist.append(li);
      });

      $(".modal-icon-img")
        .off("click")
        .on("click", async () => {
          try {
            await db.cardinfo.delete(cardinfo.id);
            console.log(`Элемент с ID ${cardinfo.id} удален из базы данных.`);
            $(".modal-popup .modal-body").empty();
          } catch (error) {
            console.error("Ошибка при удалении элемента:", error);
          }
          $(".popup-overlay").fadeOut();
          $(".modal-popup").fadeOut();
          enableScroll();
          await sliderCardWatch();
          await updateCalendar();
        });

      $(".modal-popup .modal-body").empty().append(cardlist);
    });
}

async function addDate(nameTask, dateTask, listTask) {
  try {
    await db.cardinfo.add({
      titleCard: nameTask,
      dateCard: dateTask,
      ArrayList: listTask,
    });

    // const allCards = await db.cardinfo.toArray();

    // if (allCards.length > 0) {
    //   const lastCardId = allCards[allCards.length - 1].id;
    //   await db.cardinfo.delete(lastCardId);
    //   console.log("Последний элемент удален");
    // }
    console.log(listTask);
  } catch (error) {
    console.error("Ошибка при добавлении данных в IndexedDB:", error);
  }
}

$(".task-save").click(async function () {
  const nameTask = $("#task-title").val();
  const dateTask = $("#modal-date-create").val();
  const listTask = [];

  $(".task:visible").each(function () {
    const taskInputValue = $(this).find(".task-input-text").val();
    listTask.push({ name: taskInputValue, value: false });
  });

  if (!nameTask.trim()) {
    alert("Название задачи не может быть пустым.");
    return;
  }

  try {
    await addDate(nameTask, dateTask, listTask);
  } catch (error) {
    console.error("Ошибка при добавлении данных:", error);
  }

  $(".popup-overlay").fadeOut();
  $(".modal-popup-create").fadeOut();
  enableScroll();

  await sliderCardWatch();
  await updateCalendar();
});

function addTask() {
  const taskBody = $(".input-task");
  const task = $("<div></div>").addClass("task");
  const taskCheckBox = $("<input/>")
    .addClass("task-input-checkbox")
    .attr("type", "checkbox");
  const taskInput = $("<input/>")
    .addClass("task-input-text")
    .attr("type", "text")
    .attr("placeholder", "Дойдате завдання");

  taskBody.append(task);
  task.append(taskCheckBox).append(taskInput);
}
//////////////////////

// header
$(document).ready(function () {
  $("#datetime-day-info").text(day);

  $("#datetime-day-info").each(function () {
    $(this)
      .prop("day", 0)
      .animate(
        {
          day: $(this).text(),
        },
        {
          duration: 1500,
          easing: "swing",
          step: function (now) {
            $(this).text(Math.ceil(now));
          },
        }
      );
  });

  function textEffect(text, speed, index = 0) {
    if (index < text.length) {
      $("#datetime-date-weekday").text(
        $("#datetime-date-weekday").text() + text.charAt(index)
      );
      setTimeout(() => textEffect(text, speed, index + 1), speed);
    }
  }
  textEffect(weekday[0].toUpperCase() + weekday.slice(1), 40);

  $("#datetime-date-month").text(`.${month}`);
});

// calendar
$(document).ready(async () => {
  const truncateText = (text) => {
    const maxLength = window.innerWidth > 768 ? 14 : 6;
    if (text.length > maxLength) {
      return text.slice(0, maxLength) + "...";
    }
    return text;
  };

  async function updateCalendar() {
    const monthNames = dateCalendar.toLocaleString("uk-UA", { month: "long" });
    const year = dateCalendar.getFullYear();
    $("#month-name").text(
      `${monthNames[0].toUpperCase() + monthNames.slice(1)} ${year}`
    );

    const firstDay = new Date(
      dateCalendar.getFullYear(),
      dateCalendar.getMonth(),
      1
    ).getDay();

    const lastDate = new Date(
      dateCalendar.getFullYear(),
      dateCalendar.getMonth() + 1,
      0
    ).getDate();

    const calendarBody = $(".calendar-body").empty();
    let dayCounter = 1;
    let dayCounterNext = 1;

    for (let i = 0; i < 6; i++) {
      const row = $("<tr></tr>");

      for (let j = 1; j < 8; j++) {
        const cell = $("<td></td>");
        const dayTeg = $("<span></span>").addClass("calendar-day");
        const taskTeg = $("<span></span>").addClass("calendar-task");

        if (i === 0 && j < firstDay) {
          row.append(cell);
        } else if (dayCounter <= lastDate) {
          dayTeg.text(dayCounter);
          cell.append(dayTeg);

          await db.cardinfo
            .where("dateCard")
            .equals(
              `${dayCounter}.${
                dateCalendar.getMonth() + 1 <= 9
                  ? `0${dateCalendar.getMonth() + 1}`
                  : dateCalendar.getMonth() + 1
              }.${year}`
            )
            .first((cardinfo) => {
              if (cardinfo) {
                const task = $("<span></span>");
                task.text(truncateText(cardinfo.titleCard, 6));
                taskTeg.append(task);
              }
            });

          cell.append(taskTeg);
          row.append(cell);
          dayCounter++;
        } else {
          dayTeg.text(dayCounterNext).addClass("nextMonth");
          cell.append(dayTeg).addClass("calendar-dayNext");
          row.append(cell);
          dayCounterNext++;
        }
      }

      calendarBody.append(row);

      if (dayCounter > lastDate) break;
    }
  }

  $("#next-month").click(async () => {
    dateCalendar.setMonth(dateCalendar.getMonth() + 1);
    await updateCalendar();
  });

  $("#prev-month").click(async () => {
    dateCalendar.setMonth(dateCalendar.getMonth() - 1);
    await updateCalendar();
  });

  $("#today").click(async () => {
    dateCalendar.setMonth(dateInfo.getMonth());
    dateCalendar.setFullYear(year);
    await updateCalendar();
  });

  $("#watchCalendar").click(() => {
    $("#calendar-table").fadeIn();
    $(".task-container").fadeOut();
  });

  $("#watchTask").click(() => {
    $("#calendar-table").fadeOut();
    $(".task-container").fadeIn();
  });

  await updateCalendar();
});

// modal button
$(document).ready(() => {
  $(document).on("click", ".card-more-icon", function () {
    $(".popup-overlay").fadeIn();
    $(".modal-popup").fadeIn();
    disableScroll();

    const parentBlock = $(this).closest(".card");
    const titleModal = parentBlock.find(".card-title").text();
    sliderData(titleModal);
  });

  $(document).on("click", ".button-create", function () {
    $(".popup-overlay").fadeIn();
    $(".modal-popup-create").fadeIn();
    disableScroll();
    $("#task-title").val("");
    $(".task").empty();
    addTask();
  });

  $(".popup-overlay").click(function () {
    $(".popup-overlay").fadeOut();
    $(".modal-popup").fadeOut();
    $(".modal-popup-create").fadeOut();
    enableScroll();
  });
  $(".modal-close").click(async () => {
    $(".popup-overlay").fadeOut();
    $(".modal-popup").fadeOut();
    enableScroll();
    await sliderCardWatch();
  });
  $(".modal-close-create").click(function () {
    $(".popup-overlay").fadeOut();
    $(".modal-popup-create").fadeOut();
    enableScroll();
  });
});

// modal info
$(document).ready(function () {
  // add task
  $("#modal-date-create").flatpickr({
    altInput: true,
    altFormat: "F j, Y",
    dateFormat: "d.m.Y",
    minDate: "today",
    defaultDate: "today",
    locale: "uk",
    disableMobile: "true",
  });

  $(".add-task-icon").click(() => {
    addTask();
  });
});
