from django.db import models


class SiteState(models.Model):
    """A single shared row holding every bit of interactive state for the
    site: which boxes are opened, where each one was dragged to, and which
    bucket-list items are checked off.

    There is deliberately no per-user/per-session split -- this is a gift
    for one person, not a multi-tenant app, so the whole site shares ONE
    row (pk=1). That's what makes progress show up the same way whether
    it's opened on a phone, a laptop, or a friend's browser: there's no
    "your session" to lose, just the one shared state.

    `data` holds:
      {
        "opened": [1, 2, 3, ...],                       # box numbers
        "positions": {"1": {"x": 12.0, "y": 40.0}, ...}, # per-box drag position (desktop pile)
        "box_order": [3, 1, 2, ...],                     # display order (mobile grid swaps)
        "bucket_checked": [0, 3, 5, ...],                # bucket-list item indices
        "notes": [{"text": "...", "at": "2026-..."}],    # "write me a note" mailbox
      }
    """
    data = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"SiteState(updated_at={self.updated_at})"
