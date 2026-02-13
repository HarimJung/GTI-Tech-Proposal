이 R 코드가 하는 것 정리하면:

Step 1 — Ingest: CSV/Excel/JSON 다 먹음. 폴더 안에 80개 파트너 파일 넣으면 자동 배치 처리.

Step 2 — Validate: 스키마 체크, 중복 제거, 값 범위(0–1) 검증, 파트너 간 일관성(CV > 0.5 플래깅), 미싱데이터 국가별 요약.

Step 3 — Score: 방법론 그대로 — (Σ wᵢ × xᵢ) / (Σ wᵢ) × 100 − 0.5×(M/N)×100, 7개 필라 각각 + 전체 평균, 5단계 리스크 분류.

Step 4 — JSON Export: D3.js 대시보드에 바로 꽂히는 nested JSON 생성.

Step 5 — Excel Export: OMCT 내부 리뷰용 3-시트 포맷팅 워크북 (조건부 서식 포함).

Step 6 — Visualization: ggplot2로 랭킹(lollipop), 히트맵, 레이더, 트렌드 차트 전부 PNG 출력.

Step 7 — Factsheets: 국가별 자동 마크다운 팩트시트 생성 (PDF 변환 가능).

Step 8 — run_gti_pipeline(): 위 전부를 한 줄로 실행.