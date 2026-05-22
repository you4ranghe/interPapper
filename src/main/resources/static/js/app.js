/* Interpaper — Coverflow Faded Slider + 스크롤형 상세/토론
 * 무한 순환 트랙으로 항상 5권 노출. 클릭 시 아래 상세로 부드럽게 스크롤.
 * 람다(화살표 함수) 없이 명시적 function 으로만 작성. */
(function ($) {
  "use strict";

  /* 코버플로우 */
  var $stageArea = $("#cfStage");
  var $caption = $("#cfCaption");
  var $dots = $("#cfDots");

  /* 상세 / 토론 */
  var $detail = $("#detail");
  var $discussion = $("#discussion");
  var $backToTop = $("#backToTop");

  var books = [];
  var n = 0;
  var pointer = 0;
  var navTimer = null;
  var currentBookId = null;
  var hasSelection = false;

  /* ---------- 유틸 ---------- */
  function esc(s) { return $("<div>").text(s === null || s === undefined ? "" : String(s)).html(); }
  function mod(a, m) { return ((a % m) + m) % m; }
  function toast(msg) {
    var $t = $("#toast").text(msg).addClass("show");
    setTimeout(function () { $t.removeClass("show"); }, 2200);
  }
  function readError(xhr, fallback) {
    if (xhr && xhr.responseJSON && xhr.responseJSON.message) { return xhr.responseJSON.message; }
    return fallback || "요청 처리 중 오류가 발생했습니다.";
  }
  function smoothTo(el) {
    if (el && el.scrollIntoView) { el.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }

  /* ====================== Coverflow ====================== */
  function loadBooks() {
    $stageArea.html('<p class="empty" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)">서가를 정리하는 중…</p>');
    $.getJSON("/api/books")
      .done(function (data) {
        books = data || [];
        n = books.length;
        if (n === 0) { $stageArea.html('<p class="empty" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)">아직 등록된 책이 없습니다.</p>'); return; }
        buildItems();
        buildDots();
        pointer = n;
        layout(false);
        requestAnimationFrame(function () { $stageArea.addClass("ready"); });
      })
      .fail(function (xhr) {
        $stageArea.html('<p class="empty" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)">' + esc(readError(xhr, "책 목록을 불러오지 못했습니다.")) + '</p>');
      });
  }

  function buildItems() {
    $stageArea.empty();
    var total = n * 3;
    var k;
    for (k = 0; k < total; k++) {
      var b = books[k % n];
      var $item = $(
        '<article class="cf-item pos-hidden" role="button" tabindex="0" aria-label="' + esc(b.title) + '">' +
          '<img src="' + esc(b.imagePath) + '" alt="' + esc(b.title) + ' 표지">' +
        '</article>'
      );
      $item.attr("data-k", k);
      $item.data("id", b.id);
      $stageArea.append($item);
    }
  }

  function buildDots() {
    $dots.empty();
    var i;
    for (i = 0; i < n; i++) {
      var $d = $('<button type="button" class="dot" aria-label="' + (i + 1) + '번째 책"></button>');
      $d.attr("data-book", i);
      $dots.append($d);
    }
  }

  function layout(animate) {
    if (animate === false) { $stageArea.addClass("no-anim"); }
    $stageArea.children(".cf-item").each(function () {
      var k = parseInt($(this).attr("data-k"), 10);
      var off = k - pointer;
      var cls = "cf-item ";
      if (off === 0) { cls += "pos-0"; }
      else if (off === -1) { cls += "pos-l1"; }
      else if (off === 1) { cls += "pos-r1"; }
      else if (off === -2) { cls += "pos-l2"; }
      else if (off === 2) { cls += "pos-r2"; }
      else { cls += "pos-hidden"; }
      $(this).attr("class", cls);
    });
    if (animate === false) { void $stageArea[0].offsetWidth; $stageArea.removeClass("no-anim"); }
    updateCaption();
    updateDots();
  }

  function updateCaption() {
    var b = books[mod(pointer, n)];
    if (!b) { $caption.empty(); return; }
    $caption.html(
      '<div class="pill">' +
        '<span class="t">' + esc(b.title) + '</span>' +
        '<span class="s">클릭하여 펼치기 · ' + (mod(pointer, n) + 1) + ' / ' + n + '</span>' +
      '</div>'
    );
  }

  function updateDots() {
    var active = mod(pointer, n);
    $dots.children(".dot").each(function () {
      $(this).toggleClass("active", parseInt($(this).attr("data-book"), 10) === active);
    });
  }

  function rebase() {
    var canonical = n + mod(pointer - n, n);
    if (canonical !== pointer) { pointer = canonical; layout(false); }
  }
  function scheduleRebase() {
    if (navTimer) { clearTimeout(navTimer); }
    navTimer = setTimeout(rebase, 640);
  }
  function moveTo(p) { pointer = p; layout(true); scheduleRebase(); }
  function goPrev() { moveTo(pointer - 1); }
  function goNext() { moveTo(pointer + 1); }

  function onItemActivate(el) {
    var k = parseInt($(el).attr("data-k"), 10);
    if (k === pointer) { selectBook($(el).data("id")); }
    else { moveTo(k); }
  }
  $stageArea.on("click", ".cf-item", function () { onItemActivate(this); });
  $stageArea.on("keydown", ".cf-item", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onItemActivate(this); }
  });
  $dots.on("click", ".dot", function () { moveTo(n + parseInt($(this).attr("data-book"), 10)); });
  $("#cfPrev").on("click", goPrev);
  $("#cfNext").on("click", goNext);

  $(document).on("keydown", function (e) {
    if (e.key === "ArrowLeft") { goPrev(); }
    else if (e.key === "ArrowRight") { goNext(); }
  });

  /* ====================== 상세 / 토론 ====================== */
  function selectBook(bookId) {
    currentBookId = bookId;
    $.getJSON("/api/books/" + bookId)
      .done(function (book) {
        fillDetail(book);
        revealSections();
        smoothTo(document.getElementById("detail"));
      })
      .fail(function (xhr) { toast(readError(xhr, "상세 정보를 불러오지 못했습니다.")); });
  }

  function fillDetail(book) {
    $("#dCover").attr("src", book.imagePath).attr("alt", book.title + " 표지");
    $("#dTitle").text(book.title);
    $("#dMeta").text("출간 기록 · " + book.createdAt);
    $("#dIntro").text(book.introduction);
    $("#dNoteText").text(book.authorNote || "");
    renderComments(book);
  }

  function renderComments(book) {
    $("#dCount").text("(" + book.commentCount + ")");
    $("#commentTree").html(renderTree(book.comments));
    $("#rootForm").html('<div class="root-form">' + formInner(null) + '</div>');
  }

  function revealSections() {
    if (!hasSelection) {
      $detail.removeAttr("hidden");
      $discussion.removeAttr("hidden");
      hasSelection = true;
      requestAnimationFrame(function () {
        $detail.addClass("reveal");
        $discussion.addClass("reveal");
      });
    }
  }

  /* 댓글 등록 후 트리만 갱신(스크롤 유지) */
  function refreshComments() {
    if (!currentBookId) { return; }
    $.getJSON("/api/books/" + currentBookId).done(function (book) { renderComments(book); });
  }

  /* ---------- 대댓글 트리 ---------- */
  function renderTree(nodes) {
    if (!nodes || nodes.length === 0) { return '<p class="empty">아직 댓글이 없습니다. 첫 감상을 남겨보세요.</p>'; }
    var out = "";
    var i;
    for (i = 0; i < nodes.length; i++) { out += renderNode(nodes[i]); }
    return out;
  }
  function renderNode(c) {
    var authorClass = (c.nickname === "저자") ? " author" : "";
    var childrenHtml = "";
    if (c.children && c.children.length > 0) { childrenHtml = '<div class="children">' + renderTree(c.children) + '</div>'; }
    return (
      '<div class="comment" data-id="' + c.id + '">' +
        '<div class="c-head">' +
          '<span class="c-nick' + authorClass + '">' + esc(c.nickname) + '</span>' +
          '<span class="c-time">' + esc(c.createdAt) + '</span>' +
        '</div>' +
        '<div class="c-body">' + esc(c.content) + '</div>' +
        '<button class="c-reply-btn" data-id="' + c.id + '">↳ 답글</button>' +
        '<div class="reply-slot"></div>' +
        childrenHtml +
      '</div>'
    );
  }

  /* ---------- 입력 폼 ---------- */
  function formInner(parentId) {
    var pid = parentId ? ' data-parent="' + parentId + '"' : "";
    var cancel = parentId ? '<button type="button" class="btn secondary cancel-reply">취소</button>' : "";
    return (
      '<form class="comment-form"' + pid + '>' +
        '<div class="row"><input type="text" name="nickname" maxlength="50" placeholder="닉네임" required></div>' +
        '<div class="row"><textarea name="content" maxlength="2000" placeholder="감상을 남겨주세요…" required></textarea></div>' +
        '<div class="form-actions">' +
          '<button type="submit" class="btn">등록</button>' + cancel +
          '<span class="form-error"></span>' +
        '</div>' +
      '</form>'
    );
  }

  $discussion.on("click", ".c-reply-btn", function () {
    var $slot = $(this).siblings(".reply-slot");
    if ($slot.children().length > 0) { $slot.empty(); return; }
    $discussion.find(".reply-slot").empty();
    $slot.html('<div class="reply-form">' + formInner($(this).data("id")) + '</div>');
    $slot.find("input[name=nickname]").trigger("focus");
  });
  $discussion.on("click", ".cancel-reply", function () { $(this).closest(".reply-slot").empty(); });

  $discussion.on("submit", ".comment-form", function (e) {
    e.preventDefault();
    var $form = $(this);
    var $err = $form.find(".form-error").text("");
    var payload = {
      bookId: currentBookId,
      nickname: $.trim($form.find("input[name=nickname]").val()),
      content: $.trim($form.find("textarea[name=content]").val()),
      parentId: $form.data("parent") || null
    };
    if (!payload.nickname || !payload.content) { $err.text("닉네임과 내용을 입력하세요."); return; }
    var $submit = $form.find('button[type=submit]').prop("disabled", true);
    $.ajax({
      url: "/api/comments", method: "POST",
      contentType: "application/json; charset=UTF-8", data: JSON.stringify(payload)
    })
      .done(function () { toast("등록되었습니다."); refreshComments(); })
      .fail(function (xhr) { $err.text(readError(xhr, "등록에 실패했습니다.")); $submit.prop("disabled", false); });
  });

  /* "저자와의 토론 보기" → 토론 섹션으로 */
  $("#toDiscuss").on("click", function () { smoothTo(document.getElementById("discussion")); });

  /* ---------- 사이드 버튼: 맨 위로 ---------- */
  $backToTop.on("click", function () {
    if (window.scrollTo) { window.scrollTo({ top: 0, behavior: "smooth" }); }
  });

  function onScroll() {
    var show = hasSelection && window.pageYOffset > window.innerHeight * 0.55;
    $backToTop.toggleClass("show", show);
  }
  $(window).on("scroll resize", onScroll);

  /* ====================== 새 책 등록 모달 ====================== */
  var $addModal = $("#addModal");

  function openAddModal() {
    $addModal.removeAttr("hidden");
    requestAnimationFrame(function () { $addModal.addClass("open"); });
  }
  function closeAddModal() {
    $addModal.removeClass("open");
    setTimeout(function () { $addModal.attr("hidden", "hidden"); }, 360);
  }
  function resetAddForm() {
    var form = document.getElementById("addForm");
    if (form) { form.reset(); }
    $("#coverPreview").attr("src", "").attr("hidden", "hidden");
    $("#fdText").show();
    $("#addError").text("");
    $("#addSubmit").prop("disabled", false);
  }

  $("#addBookBtn").on("click", openAddModal);
  $("#addClose").on("click", closeAddModal);
  $("#addCancel").on("click", closeAddModal);
  $addModal.on("click", function (e) { if (e.target === this) { closeAddModal(); } });
  $(document).on("keydown", function (e) {
    if (e.key === "Escape" && !$addModal.is("[hidden]")) { closeAddModal(); }
  });

  /* 표지 미리보기 */
  $("#coverInput").on("change", function () {
    var file = this.files && this.files[0];
    if (!file) { return; }
    var reader = new FileReader();
    reader.onload = function (ev) {
      $("#coverPreview").attr("src", ev.target.result).removeAttr("hidden");
      $("#fdText").hide();
    };
    reader.readAsDataURL(file);
  });

  /* 등록 제출 (multipart/form-data) */
  $("#addForm").on("submit", function (e) {
    e.preventDefault();
    var $err = $("#addError").text("");
    var title = $.trim($(this).find("input[name=title]").val());
    var intro = $.trim($(this).find("textarea[name=introduction]").val());
    var note = $.trim($(this).find("textarea[name=authorNote]").val());
    var coverEl = document.getElementById("coverInput");
    var file = coverEl.files && coverEl.files[0];
    if (!file) { $err.text("표지 이미지를 선택해 주세요."); return; }
    if (!title || !intro || !note) { $err.text("모든 항목을 입력해 주세요."); return; }

    var fd = new FormData();
    fd.append("cover", file);
    fd.append("title", title);
    fd.append("introduction", intro);
    fd.append("authorNote", note);

    var $submit = $("#addSubmit").prop("disabled", true).text("등록 중…");
    $.ajax({ url: "/api/books", method: "POST", data: fd, processData: false, contentType: false })
      .done(function () {
        toast("새 책이 서가에 등록되었습니다.");
        closeAddModal();
        resetAddForm();
        loadBooks();   // 코버플로우 갱신 → 최신 책이 가운데로
      })
      .fail(function (xhr) {
        $err.text(readError(xhr, "등록에 실패했습니다."));
        $submit.prop("disabled", false).text("등록하기");
      });
  });

  /* ---------- 시작 ---------- */
  $(function () { loadBooks(); });
})(jQuery);
