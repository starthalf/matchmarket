-- ============================================================
-- 매치별 조회수(view_count) 컬럼 추가
-- ============================================================
-- 배경
--  기존 seller_view_count 는 이름상 "판매자 조회수"이고, 매치 상세 진입 시
--  해당 매치 행의 값을 +1 하는 방식으로 쓰이고 있었다.
--  인기 리워드는 "이 매치가 이번 달에 얼마나 조회됐나"를 알아야 하므로
--  매치 단위 카운터를 명확한 이름으로 분리한다.
--
--  seller_view_count 는 기존 화면들이 참조 중이므로 삭제하지 않고 그대로 둔다.
--  (앞으로 조회수 증가는 두 컬럼 모두 갱신)
-- ============================================================

-- 1) 컬럼 추가
alter table public.matches
  add column if not exists view_count integer not null default 0;

-- 2) 기존 데이터 이관 (seller_view_count 값을 초기값으로)
update public.matches
set view_count = coalesce(seller_view_count, 0)
where view_count = 0;

-- 3) 인기도 집계용 인덱스
create index if not exists idx_matches_seller_date
  on public.matches using btree (seller_id, date);

create index if not exists idx_matches_view_count
  on public.matches using btree (view_count desc);


-- ============================================================
-- 조회수 원자적 증가 함수
-- ============================================================
-- 클라이언트에서 read → +1 → write 하면 동시 접속 시 카운트가 유실된다.
-- DB에서 원자적으로 증가시키는 RPC를 만든다.
-- 호출: supabase.rpc('increment_match_view', { p_match_id: 'xxx' })
-- ============================================================

create or replace function public.increment_match_view(p_match_id text)
returns integer
language plpgsql
security definer
as $$
declare
  v_new_count integer;
begin
  update public.matches
  set
    view_count = view_count + 1,
    seller_view_count = seller_view_count + 1
  where id = p_match_id
  returning view_count into v_new_count;

  return coalesce(v_new_count, 0);
end;
$$;

-- 익명/인증 사용자 모두 호출 가능하게
grant execute on function public.increment_match_view(text) to anon, authenticated;
