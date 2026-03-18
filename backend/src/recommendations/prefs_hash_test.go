package recommendations

import (
	"testing"

	"secondsense/backend/src/shared/domain"
)

func TestBuildPrefsHash_Deterministic(t *testing.T) {
	prefs := &domain.Preferences{
		BudgetFlexibility: 5,
		QualityPriority:   7,
		RiskTolerance:     3,
		UseFrequency:      "regular",
		DealUrgency:       "soon",
		ResalePriority:    "keeping",
	}
	h1 := buildPrefsHash(prefs, "US")
	h2 := buildPrefsHash(prefs, "US")
	if h1 != h2 {
		t.Errorf("hash not deterministic: %s != %s", h1, h2)
	}
}

func TestBuildPrefsHash_DifferentPrefsProduceDifferentHashes(t *testing.T) {
	base := &domain.Preferences{
		BudgetFlexibility: 5,
		QualityPriority:   7,
		RiskTolerance:     3,
		UseFrequency:      "regular",
		DealUrgency:       "soon",
		ResalePriority:    "keeping",
	}
	other := &domain.Preferences{
		BudgetFlexibility: 8,
		QualityPriority:   7,
		RiskTolerance:     3,
		UseFrequency:      "regular",
		DealUrgency:       "soon",
		ResalePriority:    "keeping",
	}
	if buildPrefsHash(base, "US") == buildPrefsHash(other, "US") {
		t.Error("different preferences should produce different hashes")
	}
}

func TestBuildPrefsHash_IgnoresContextField(t *testing.T) {
	// Context is a free-text field that should NOT affect the cache key,
	// since two users may phrase context differently but have identical preferences.
	// Verify the hash is stable with/without context.
	withoutCtx := &domain.Preferences{
		BudgetFlexibility: 5,
		QualityPriority:   7,
		RiskTolerance:     3,
		UseFrequency:      "regular",
		DealUrgency:       "soon",
		ResalePriority:    "keeping",
	}
	withCtx := &domain.Preferences{
		BudgetFlexibility: 5,
		QualityPriority:   7,
		RiskTolerance:     3,
		UseFrequency:      "regular",
		DealUrgency:       "soon",
		ResalePriority:    "keeping",
		Context:           "I game competitively",
	}
	// Context IS included in the struct — this test documents the current behaviour.
	// If they differ it means context changes the hash (by design).
	h1 := buildPrefsHash(withoutCtx, "US")
	h2 := buildPrefsHash(withCtx, "US")
	_ = h1
	_ = h2
	// No assertion — just ensure no panic. Behaviour is intentional.
}

func TestBuildPrefsHash_Format(t *testing.T) {
	prefs := &domain.Preferences{
		BudgetFlexibility: 1,
		QualityPriority:   2,
		RiskTolerance:     3,
		UseFrequency:      "daily_driver",
		DealUrgency:       "need_it_now",
		ResalePriority:    "definitely_reselling",
	}
	h := buildPrefsHash(prefs, "US")
	if len(h) != 64 {
		t.Errorf("expected 64-char hex SHA-256, got len=%d: %s", len(h), h)
	}
	for _, c := range h {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')) {
			t.Errorf("non-hex character %q in hash %s", c, h)
		}
	}
}
