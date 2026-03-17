PDF=main.pdf
TEX=main.tex
.PHONY: all diagrams clean

all: $(PDF)

$(PDF): $(TEX) references.bib diagrams
	tectonic $(TEX)

diagrams:
	curl -s -X POST --data-binary @assets/diagrams/architecture.mmd https://kroki.io/mermaid/png -o assets/diagrams/architecture.png
	curl -s -X POST --data-binary @assets/diagrams/session-bootstrap.mmd https://kroki.io/mermaid/png -o assets/diagrams/session-bootstrap.png
	curl -s -X POST --data-binary @assets/diagrams/usecases.mmd https://kroki.io/mermaid/png -o assets/diagrams/usecases.png

clean:
	rm -f *.aux *.bbl *.blg *.log *.lof *.lot *.out *.toc *.pdf
