package pagination

// Params holds pagination query parameters.
type Params struct {
	Page  int `form:"page"`
	Limit int `form:"limit"`
}

// Normalize ensures safe defaults and limits.
func (p *Params) Normalize() {
	if p.Page < 1 {
		p.Page = 1
	}
	if p.Limit < 1 || p.Limit > 100 {
		p.Limit = 20
	}
}

// Offset calculates the SQL OFFSET from page/limit.
func (p *Params) Offset() int {
	return (p.Page - 1) * p.Limit
}

// TotalPages calculates the total number of pages.
func TotalPages(total int64, limit int) int {
	if limit <= 0 {
		return 0
	}
	pages := int(total) / limit
	if int(total)%limit != 0 {
		pages++
	}
	return pages
}
