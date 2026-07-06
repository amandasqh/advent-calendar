import json
import os
from datetime import date, datetime
from zoneinfo import ZoneInfo

from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.views.decorators.clickjacking import xframe_options_sameorigin
from django.views.decorators.http import require_POST

from .models import SiteState

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

BIRTHDAY = date(2026, 7, 24)
TOTAL_BOXES = 24
# Calendar starts 24 days before the birthday -> box `n` becomes available on
# START_DATE + (n-1) days.
START_DATE = date(2026, 7, 1)

# Set to True while you're building/previewing to unlock every day regardless
# of the real date (so you can click through all 24 surprises). Set back to
# False before sending the link to anyone!
DEBUG_MODE = False


LOCAL_TZ = ZoneInfo("Asia/Singapore")


def _today():
    """Wrapped so it's trivial to fake/test a specific date if ever needed."""
    return datetime.now(LOCAL_TZ).date()


def day_index_for(today=None):
    """How many days since the calendar started (1-indexed). Can exceed 24."""
    today = today or _today()
    return (today - START_DATE).days + 1


def effective_day_index():
    """Like day_index_for(), but pinned to the last day when DEBUG_MODE is on."""
    return TOTAL_BOXES if DEBUG_MODE else day_index_for()


# ---------------------------------------------------------------------------
# CONTENT
# ---------------------------------------------------------------------------
# type is one of: photo, coupon, gift, letter, map, breathing, finale, others

BOX_CONTENT = [
    {
        "title": "Favourite photos of you",
        "type": "photo",
        "emoji": "📷",
        "body": "A few of my favourite photos of you where I think you look cutie",
        "images": ["img/photos/fav_photo1.jpg", "img/photos/fav_photo2.jpg", "img/photos/fav_photo3.jpg"],
    },
    {
        "title": "Massage coupon",
        "type": "coupon",
        "emoji": "💆",
        "body": "Redeemable any time you're feeling tense. Expires 100 years later!",
        "coupons": ["img/coupons/coupon_massage.png"],
    },
    {
        "title": "Free kisses & hugs coupon",
        "type": "coupon",
        "emoji": "💋",
        "body": "One million free kisses & hugs. Terms and conditions: limited to 5 minutes each day.",
        "coupons": ["img/coupons/coupon_xoxo.png"],
    },
    {
        "title": "Movie date + bonus points coupon",
        "type": "coupon",
        "emoji": "🎬",
        "body": "A movie date and some bonus points for being such a caring and loving boyfie!",
        "coupons": ["img/coupons/coupon_movienight.png", "img/coupons/coupon_bonuspts.png"],
    },
    {
        "title": "Stain remover pen",
        "type": "gift",
        "emoji": "🖊️",
        "body": "For all of our little accidents. One for each of us!",
        # "image": "img/gifts/stain_pen.png",
    },
    {
        "title": "Playlist unlocked!",
        "type": "others",
        "emoji": "🎧",
        "body": "A playlist of songs that remind me of you or that you mentioned you liked. Check the music player!",
        "image": "img/music.png",
    },
    {
        "title": "What I'm grateful for",
        "type": "letter",
        "emoji": "💌",
        "body": "",
        "letter": [
            "Dear Mossy,",
            "I don't say this enough, but I'm so grateful for the little everyday things -- the silly voice notes, the way you save snacks for me, the way you care for me when I'm healthy and ill.",
            "Thank you for staying by my side and listening to me.",
            "Thank you for trying your best even on days you are tired.",
            "Thank you for everything that you do.",
        ],
    },
    {
        "title": "Date night of your choice coupon",
        "type": "coupon",
        "emoji": "🍽️",
        "body": "Redeemable for one (1) date, fully planned by you.",
        "coupons": ["img/coupons/coupon_datenight_2.png"],
    },
    {
        "title": "Mossy snack box",
        "type": "gift",
        "emoji": "🍬",
        "body": "A little box of your favourite snacks. Don't finish it all in one go but remember to eat it! Please 🥺",
        # "image": "img/gifts/snack_box.png",
    },
    {
        "title": "Our bucket list",
        "type": "bucketlist",
        "emoji": "📝",
        "body": "Little dreams for us, in no particular order. Tap the ones you're most excited for.",
        "bucket_items": [
            {"emoji": "🗾", "text": "Road trip in New Zealand / Korea / Japan"},
            {"emoji": "🌌", "text": "Chase the Northern Lights"},
            {"emoji": "🥐", "text": "Bake bread together"},
            {"emoji": "🏡", "text": "Decorate our first home together"},
            {"emoji": "📸", "text": "Fill a whole photo album, printed, not digital"},
            {"emoji": "🚴", "text": "Cycle together"},
            {"emoji": "🍜", "text": "Eat our way through a new country's street food"},
        ],
    },
    {
        "title": "Favourite photos of us",
        "type": "photo",
        "emoji": "📸",
        "body": "Some of my favourite photos of us together. Do you remember when and where we took them?",
        "images": ["img/photos/fav_photo_us1.jpeg", "img/photos/fav_photo_us2.jpeg", "img/photos/fav_photo_us3.jpeg"],
    },
    {
        "title": "Bakes",
        "type": "gift",
        "emoji": "🍰",
        "body": "Something baked with love.",
        # "image": "img/gifts/bakes.png",
    },
    {
        "title": "Free pass!",
        "type": "coupon",
        "emoji": "🕊️",
        "body": "Redeemable for three argument-free days, whenever you need it. Promise mandi won't be upset!",
        "coupons": ["img/coupons/coupon_freepass.png"],
    },
    {
        "title": "Airpods case",
        "type": "gift",
        "emoji": "🎧",
        "body": "A little something to keep your earphones safe.",
        # "image": "img/gifts/airpods_case.png",
    },
    {
        "title": "The biggest difference I saw in you",
        "type": "letter",
        "emoji": "🌱",
        "body": "",
        "letter": [
            "Dear Mossy,",
            "I've watched you grow so much this year -- more active, more open, more you.",
            "I've watched it happen up close, and it's amazing how many new things we discovered and explored together!",
            "Thank you for being vulnerable to me and letting me into your heart.",
            "I hope this lets you know how much you mean to me, even when my words and actions sometimes say otherwise.",
            "To countless more lessons and experiences to go through together!",
        ],
    },
    {
        "title": "Date night coupon",
        "type": "coupon",
        "emoji": "🗓️",
        "body": "Redeemable for one (1) night of your choosing.",
        "coupons": ["img/coupons/coupon_datenight_1.png"],
    },
    {
        "title": "Favourite memory",
        "type": "letter",
        "emoji": "📖",
        "body": "",
        "letter": [
            "Dear Mossy,",
            "My favourite memory of us is still the small, ordinary ones -- from how you would hold in your breath when I fart to how we tease each other about our quirks.",
            "I still feel the cruise trip we had was the most memorable I've ever had, and I think you might feel the same!",
            "All the food we ate, sights we saw, shows we watched -- it was so much fun, and also such a good break from work.",
            "Thanks for arranging these, I've loved every bit of them.",
        ],
    },
    {
        "title": "Socks",
        "type": "gift",
        "emoji": "🧦",
        "body": "Warm feet, warm heart. No rashies!",
        # "image": "img/gifts/socks.png",
    },
    {
        "title": "World map",
        "type": "map",
        "emoji": "🗺️",
        "body": "Where we've been, and where we're going next.",
    },
    {
        "title": "Ring holder necklace",
        "type": "gift",
        "emoji": "💍",
        "body": "I know how much you cherish your rings. I've gotten this for you so they are always safe and close to your heart, even when your hands and mind are busy.",
        # "image": "img/gifts/ring_holder.png",
    },
    {
        "title": "Card",
        "type": "gift",
        "emoji": "💌",
        "body": "A handmade card just for you.",
        # "image": "img/gifts/card.png",
    },
    {
        "title": "Yoga towel",
        "type": "gift",
        "emoji": "🧘",
        "body": "To keep you safe as we stretch and breathe together.",
        # "image": "img/gifts/yoga_mat.png",
    },
    {
        "title": "Breathe with me",
        "type": "breathing",
        "emoji": "🌬️",
        "body": "A little breathing space, for whenever you need it.",
    },
    {
        "title": "For you, always",
        "type": "finale",
        "emoji": "🎁",
        "body": "One last gift. Are you ready?",
    },
]

STAMP_DATES = {1, 2, 3, 4, 6, 8, 10, 12, 14, 15, 16, 18, 19, 20, 21}

STAMPS = [
    {"title": "Our first puzzle together", "body": "We did our first Lego puzzle together, and also mossy's first staycay at mandi's house!", "date": "15 Nov 2025", "image": "img/stickers/sticker 1.png"},
    {"title": "Rings made with love", "body": "Highly anticipated rings for our engagement and wedding! Thank you for going on this journey with me.", "date": "22 Mar 2026", "image": "img/stickers/sticker 2.png"},
    {"title": "Stardew Concert", "body": "It was so nice to bring you to something I really like - concerts and Stardew Valley game!", "date": "28 Sep 2025", "image": "img/stickers/sticker 3.png"},
    {"title": "First cruise together", "body": "So much food, shows, games and we got to do everything for the first time together.", "date": "21 Dec 2025", "image": "img/stickers/sticker 4.png"},
    {"title": "My favourite photo of you", "body": "Young cutety mossy! One of the first photos of you that you sent me.", "date": "12 June 19xx", "image": "img/stickers/sticker 5.png"},
    {"title": "First Valentine's together", "body": "Retro music and dancing - what more can I ask for?", "date": "15 Feb 2026", "image": "img/stickers/sticker 6.png"},
    {"title": "First snack from mossy", "body": "One of the first snacks you gave me, so sweet of you.", "date": "14 Aug 2025", "image": "img/stickers/sticker 7.png"},
    {"title": "First bake together!", "body": "Baked our first pizza together! Let's bake more together in the future!", "date": "10 Jan 2026", "image": "img/stickers/sticker 8.png"},
    {"title": "Your favourite dessert", "body": "Rather surprising to learn that you like chendol so much!", "date": "22 Dec 2025", "image": "img/stickers/sticker 9.png"},
    {"title": "First sushi", "body": "Your first time trying sushi, and our first time eating sushi together.", "date": "7 Dec 2025", "image": "img/stickers/sticker 10.png"},
    {"title": "Museum trip", "body": "Birthplace of our first drawing together, which you kept!", "date": "14 Dec 2025", "image": "img/stickers/sticker 11.png"},
    {"title": "Kooza!", "body": "One of the most memorable shows we watched together.", "date": "12 Feb 2026", "image": "img/stickers/sticker 12.png"},
    {"title": "First concerto", "body": "Best part it's free! Second best the music was nice, third best it's with you.", "date": "7 Mar 2026", "image": "img/stickers/sticker 13.png"},
    {"title": "Dino museum", "body": "One of our first few dates together, and first few selfies.", "date": "2 Nov 2025", "image": "img/stickers/sticker 14.png"},
    {"title": "Trains at GBTB", "body": "A nice relaxing day walking around, then a yummy hotdog after!", "date": "7 Dec 2025", "image": "img/stickers/sticker 15.png"},
]

ITEM_IMAGE_COUNT = 24  # img/items/item 1.png ... item 24.png


# ---------------------------------------------------------------------------
# SHARED STATE (cross-device -- one row for the whole site, see models.py)
# ---------------------------------------------------------------------------

def _load_state():
    obj, _created = SiteState.objects.get_or_create(pk=1, defaults={"data": {}})
    data = obj.data or {}
    data.setdefault("opened", [])
    data.setdefault("positions", {})
    data.setdefault("bucket_checked", [])
    return obj, data


def _save_state(obj, data):
    obj.data = data
    obj.save(update_fields=["data", "updated_at"])


def _get_opened():
    _, data = _load_state()
    return set(data.get("opened", []))


def _mark_opened(number):
    obj, data = _load_state()
    opened = data.get("opened", [])
    if number not in opened:
        opened.append(number)
        data["opened"] = opened
        _save_state(obj, data)


def _get_positions():
    _, data = _load_state()
    return data.get("positions", {})


def _save_position(number, x, y):
    obj, data = _load_state()
    positions = data.get("positions", {})
    positions[str(number)] = {"x": x, "y": y}
    data["positions"] = positions
    _save_state(obj, data)


def _get_bucket_checked():
    _, data = _load_state()
    return set(data.get("bucket_checked", []))


def _toggle_bucket(index):
    obj, data = _load_state()
    checked = data.get("bucket_checked", [])
    if index in checked:
        checked.remove(index)
    else:
        checked.append(index)
    data["bucket_checked"] = checked
    _save_state(obj, data)
    return checked


# ---------------------------------------------------------------------------
# VIEWS
# ---------------------------------------------------------------------------

def home(request):
    return render(request, "home.html")


@xframe_options_sameorigin
def music_player(request):
    return render(request, "components/music_player.html")


def main_screen(request):
    today_index = effective_day_index()
    opened = _get_opened()
    positions = _get_positions()
    stamp_index = 0

    boxes = []
    for number in range(1, TOTAL_BOXES + 1):
        content = BOX_CONTENT[number - 1]
        image_path = f"img/items/item {((number - 1) % ITEM_IMAGE_COUNT) + 1}.png"

        collect_stamp = number in STAMP_DATES
        stamp = None
        if collect_stamp:
            stamp_index += 1
            if stamp_index <= len(STAMPS):
                stamp = STAMPS[stamp_index - 1]

        is_opened = number in opened
        is_available = number <= today_index
        if is_opened:
            state = "opened"
        elif is_available:
            state = "available"
        else:
            state = "locked"

        saved_pos = positions.get(str(number))

        box = {
            "number": number,
            "title": content["title"],
            "body": content.get("body", ""),
            "type": content["type"],
            "emoji": content.get("emoji", "💌"),
            "image": image_path,
            "state": state,
            "unlock_day": number,
            "collect_stamp": collect_stamp,
            "stamp_image": stamp["image"] if stamp else "img/stickers/sticker 1.png",
            "stamp_title": stamp["title"] if stamp else "",
            "stamp_body": stamp["body"] if stamp else "",
            "stamp_date": stamp["date"] if stamp else "",
            "has_saved_position": saved_pos is not None,
            "x": saved_pos["x"] if saved_pos else 0,
            "y": saved_pos["y"] if saved_pos else 0,
        }
        box["content_json"] = json.dumps({**content, "number": number})
        boxes.append(box)

    playlist_unlocked = 6 in opened or today_index >= 6

    return render(request, "main_screen.html", {
        "boxes": boxes,
        "stamp_collection_unlocked": True,
        "playlist_unlocked": playlist_unlocked,
        "today_index": today_index,
        "total_boxes": TOTAL_BOXES,
        "finale_ready": TOTAL_BOXES in opened,
    })


def letter(request):
    return render(request, "letter.html")


def finale(request):
    opened = _get_opened()
    if TOTAL_BOXES not in opened and effective_day_index() < TOTAL_BOXES:
        return redirect("main_screen")
    return render(request, "finale.html")


# ---------------------------------------------------------------------------
# API -- all POST endpoints expect JSON bodies and are same-origin, so
# Django's CSRF cookie/header pair is used (see main_screen.js for the
# fetch() calls that attach the X-CSRFToken header). State is shared
# site-wide (see models.SiteState), not per-session, so progress carries
# over across devices/browsers automatically.
# ---------------------------------------------------------------------------

@require_POST
def api_open_box(request):
    try:
        data = json.loads(request.body or "{}")
        number = int(data.get("number"))
    except (TypeError, ValueError, json.JSONDecodeError):
        return JsonResponse({"ok": False, "error": "invalid payload"}, status=400)

    if not (1 <= number <= TOTAL_BOXES):
        return JsonResponse({"ok": False, "error": "out of range"}, status=400)

    if number > effective_day_index():
        return JsonResponse({"ok": False, "error": "not yet available"}, status=403)

    _mark_opened(number)
    return JsonResponse({"ok": True, "opened": sorted(_get_opened())})


@require_POST
def api_save_position(request):
    try:
        data = json.loads(request.body or "{}")
        number = int(data.get("number"))
        x = float(data.get("x"))
        y = float(data.get("y"))
    except (TypeError, ValueError, json.JSONDecodeError):
        return JsonResponse({"ok": False, "error": "invalid payload"}, status=400)

    _save_position(number, x, y)
    return JsonResponse({"ok": True})


@require_POST
def api_bucket_list(request):
    try:
        data = json.loads(request.body or "{}")
        index = int(data.get("index"))
    except (TypeError, ValueError, json.JSONDecodeError):
        return JsonResponse({"ok": False, "error": "invalid payload"}, status=400)

    checked = _toggle_bucket(index)
    return JsonResponse({"ok": True, "checked": sorted(checked)})


def api_get_state(request):
    return JsonResponse({
        "opened": sorted(_get_opened()),
        "positions": _get_positions(),
        "bucket_checked": sorted(_get_bucket_checked()),
        "today_index": day_index_for(),
    })


# ---------------------------------------------------------------------------
# OPS: health check (for Render) + a reset endpoint.
#
# Free-tier Render web services don't get shell/SSH access, so there's no
# `python manage.py shell` to clear SiteState after a test run. This gives
# you a URL-based escape hatch instead: set RESET_TOKEN as an environment
# variable in Render's dashboard, then visit
#   https://<your-app>.onrender.com/api/reset/?token=<that value>
# to wipe all progress and start over. Leave RESET_TOKEN unset locally and
# this endpoint just 404s-equivalent (403) for everyone, including you.
# ---------------------------------------------------------------------------

def healthz(request):
    return JsonResponse({"status": "ok"})


def api_reset_state(request):
    reset_token = os.environ.get("RESET_TOKEN")
    if not reset_token or request.GET.get("token") != reset_token:
        return JsonResponse({"ok": False, "error": "forbidden"}, status=403)

    SiteState.objects.all().delete()
    return JsonResponse({"ok": True, "message": "All progress has been reset."})
