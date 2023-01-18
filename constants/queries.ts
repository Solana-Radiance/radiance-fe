// params {{address}} as token accounts
// {{main_address}} as main
export const WALLET_BALANCE_QUERY = `with
prices as (
select 
  date(recorded_hour) as date,
  token_address,
  symbol,
  avg(close) as price
from solana.core.ez_token_prices_hourly p
group by 1, 2, 3
),

sol_prices as (
    select 
      date(block_timestamp) as date,
      replace(feed_name, ' / USD') as symbol,
      median(coalesce(latest_answer_adj, latest_answer_unadj / pow(10,8))) as price --using median cause there will be some nulls / zeroes
    from ethereum.chainlink.ez_oracle_feeds
    where feed_category = 'Cryptocurrency (USD pairs)'
      and feed_name in ('SOL / USD')
    group by 1,2
    order by 1
),

net_ins as (
    select
      date(block_timestamp) as date,
      b.mint,
      sum(
  		(
  			case
  			when tx_from in ('{{address}}') and tx_to in ('{{address}}') then 0
  			when tx_from in ('{{address}}') then -amount 
  			else amount end
  		)
  	) as net_in
	from solana.core.fact_transfers b
    where  (tx_from in ('{{address}}') or tx_to in ('{{address}}'))
    group by 1,2
),

cumulative_min_date as (
  SELECT mint, MIN(date) as min_date
  FROM net_ins
  GROUP BY mint
),

close_accounts as (
select distinct tx_id
from solana.core.fact_events
where contains(signers::string, '{{main_address}}')
  and succeeded
  and event_type = 'closeAccount'
),

sol_close_account_ins as (
select 
  block_timestamp::date as date,
  'So11111111111111111111111111111111111111112' as mint,
  sum(case 
  when signers[0] = '{{main_address}}' then post_balances[0] - pre_balances[0]
  when signers[1] = '{{main_address}}' then post_balances[1] - pre_balances[1]
  when signers[2] = '{{main_address}}' then post_balances[2] - pre_balances[2]
  when signers[3] = '{{main_address}}' then post_balances[3] - pre_balances[3]
  when signers[4] = '{{main_address}}' then post_balances[4] - pre_balances[4]
  when signers[5] = '{{main_address}}' then post_balances[5] - pre_balances[5]
  when signers[6] = '{{main_address}}' then post_balances[6] - pre_balances[6]
  when signers[7] = '{{main_address}}' then post_balances[7] - pre_balances[7]
  when signers[8] = '{{main_address}}' then post_balances[8] - pre_balances[8]
  when signers[9] = '{{main_address}}' then post_balances[9] - pre_balances[9]
  else 0 end) / 1e9 as net_in
from solana.core.fact_transactions t
where exists (select 1 from close_accounts c where c.tx_id = t.tx_id)
group by 1
),

agg_net_ins as (
  select 
  	coalesce(n.date, c.date) as date,
  	coalesce(n.mint, c.mint) as mint,
  	coalesce(n.net_in, 0) + coalesce(c.net_in, 0) as net_in
  from net_ins n
  full outer join sol_close_account_ins c
  on n.date = c.date and n.mint = c.mint
),
cumulative_min_date as (
  SELECT mint, MIN(date) as min_date
  FROM agg_net_ins
  GROUP BY mint
),
  
date_dim as (select TO_DATE('20210512','YYYYMMDD') date_id  ),
dates AS (
  SELECT DISTINCT
  	date,
  	mint
  FROM (
    SELECT DATEADD(DAY, 1*SEQ4(), date_dim.date_id ) AS date
      FROM date_dim,TABLE(GENERATOR(ROWCOUNT => (1500) )) 
    WHERE date <= CURRENT_DATE
  )
  JOIN cumulative_min_date
  ON date >= min_date
),

token_balances as (
select
  d.date,
  d.mint,
  sum(coalesce(net_in, 0)) over (partition by d.mint order by d.date) as balance
from dates d
left join agg_net_ins b
on d.date = b.date and d.mint = b.mint
group by d.date, d.mint, net_in
)

select
	b.date,
  	--b.mint,
  	--p.price,
  	--upper(p.symbol) as symbol,
  	--b.balance,
	sum(b.balance *  nvl(p.price, 0)) as balance_usd,
  	balance_usd / p2.price as balance_in_sol
from token_balances b
left join prices p
on p.date = b.date and p.token_address = b.mint
left join sol_prices p2
on p2.date = b.date
group by 1, p2.price
order by 1, balance_usd desc`;

export const WALLET_NFT_RANKING_QUERY = `with buy_volume as (
    select 
        purchaser as address,
        'buy' as type,
        sum(sales_amount) as total_volume,
        count(distinct tx_id) as total_tx
    from solana.core.fact_nft_sales 
    where succeeded
    group by 1
  ),
  
  sell_volume as (
    select 
        seller as address,
        'sell' as type,
        sum(sales_amount) as total_volume,
        count(distinct tx_id) as total_tx
    from solana.core.fact_nft_sales 
    where succeeded
    group by 1
  ),
  
  address_summaries as (
    select
        address,
        sum(total_volume) as total_volume,
        sum(total_tx) as total_tx,
      sum(case when type = 'buy' then -total_volume else total_volume end) as total_sol_profit -- excluding value of inventory
    from (
      select * from buy_volume
      union
      select * from sell_volume
    )
    group by 1
  ),
  
  address_count as (
    select 
        count(1) as address_count
    from address_summaries
  ),

  ranks as (
    select
        address,
        total_volume,
        total_tx,
          address_count,
        rank() over (order by total_volume desc) as rank_by_volume,
          rank_by_volume / address_count as rank_by_volume_pct,
          case
          when rank_by_volume_pct <= 0.01 then 'Top 1%'
          when rank_by_volume_pct <= 0.05 then 'Top 5%'
          when rank_by_volume_pct <= 0.1 then 'Top 10%'
          when rank_by_volume_pct <= 0.5 then 'Top 50%'
          else 'Bottom 50%' end as tier_by_volume,
        rank() over (order by total_tx desc) as rank_by_tx_count,
          rank_by_tx_count / address_count as rank_by_tx_count_pct,
          case
          when rank_by_tx_count_pct <= 0.01 then 'Top 1%'
          when rank_by_tx_count_pct <= 0.05 then 'Top 5%'
          when rank_by_tx_count_pct <= 0.1 then 'Top 10%'
          when rank_by_tx_count_pct <= 0.5 then 'Top 50%'
          else 'Bottom 50%' end as tier_by_tx_count
    from address_summaries join address_count
  )

  select *
  from ranks
  where address = '{{address}}'
      `;

export const WALLET_DEFI_RANKING_QUERY = `with 
prices as (
select 
  date(recorded_hour) as date,
  token_address,
  symbol,
  avg(close) as price
from solana.core.ez_token_prices_hourly p
group by 1, 2, 3
),

address_summaries as (
  select 
    swapper as address,
    sum(swap_from_amount * p.price) as total_volume,
    count(distinct tx_id) as total_tx
  from solana.core.fact_swaps s
  join prices p
  on p.token_address = s.swap_from_mint and p.date = s.block_timestamp::date
  where succeeded
  group by 1
  order by total_volume desc
),


address_count as (
  select 
  	count(1) as address_count
  from address_summaries
),

ranks as (
    select
        address,
        total_volume,
        total_tx,
          address_count,
        rank() over (order by total_volume desc) as rank_by_volume,
        rank_by_volume / address_count as rank_by_volume_pct,
          case
          when rank_by_volume_pct <= 0.01 then 'Top 1%'
          when rank_by_volume_pct <= 0.05 then 'Top 5%'
          when rank_by_volume_pct <= 0.1 then 'Top 10%'
          when rank_by_volume_pct <= 0.5 then 'Top 50%'
          else 'Bottom 50%' end as tier_by_volume,
        rank() over (order by total_tx desc) as rank_by_tx_count,
          rank_by_tx_count / address_count as rank_by_tx_count_pct,
          case
          when rank_by_tx_count_pct <= 0.01 then 'Top 1%'
          when rank_by_tx_count_pct <= 0.05 then 'Top 5%'
          when rank_by_tx_count_pct <= 0.1 then 'Top 10%'
          when rank_by_tx_count_pct <= 0.5 then 'Top 50%'
          else 'Bottom 50%' end as tier_by_tx_count
    from address_summaries join address_count
)

select *
from ranks
where address = '{{address}}'`;

export const WALLET_NFT_VOLUME_QUERY = `with buy_volume as (
    select 
        block_timestamp::date as date,
        'buy' as type,
        sum(sales_amount) as total_volume,
        count(distinct tx_id) as total_tx
    from solana.core.fact_nft_sales 
    where succeeded and purchaser = '{{address}}'
    group by 1
  ),
  
  sell_volume as (
    select 
        block_timestamp::date as date,
        'sell' as type,
        sum(sales_amount) as total_volume,
        count(distinct tx_id) as total_tx
    from solana.core.fact_nft_sales 
    where succeeded and seller = '{{address}}'
    group by 1
  ),
  
  sol_prices as (
    select 
      date(block_timestamp) as date,
      replace(feed_name, ' / USD') as symbol,
      median(coalesce(latest_answer_adj, latest_answer_unadj / pow(10,8))) as price --using median cause there will be some nulls / zeroes
    from ethereum.chainlink.ez_oracle_feeds
    where feed_category = 'Cryptocurrency (USD pairs)'
      and feed_name in ('SOL / USD')
    group by 1,2
    order by 1
  )
  
    select 
        *,
        sum(total_tx) over (order by date) as cumulative_tx,
        sum(total_volume_sol) over (order by date) as cumulative_volume_sol,
        sum(total_volume_usd) over (order by date) as cumulative_volume_usd,
        sum(total_profit_sol) over (order by date) as cumulative_profit_sol,
        sum(total_profit_usd) over (order by date) as cumulative_profit_usd
    from (
      select
          agg.date,
          sum(total_volume) as total_volume_sol,
          total_volume_sol * nvl(p.price, 0) as total_volume_usd,
          sum(total_tx) as total_tx,
          sum(case when type = 'buy' then -total_volume else total_volume end) as total_profit_sol, -- excluding value of inventory
          total_profit_sol * nvl(p.price, 0) as total_profit_usd
      from (
        select * from buy_volume
        union
        select * from sell_volume
      ) agg
      left join sol_prices p
      on p.date = agg.date
      group by agg.date, p.price
    )
    group by 1,2,3,4,5,6
    order by date`;

export const WALLET_DEFI_VOLUME_QUERY = `with 
prices as (
select 
  date(recorded_hour) as date,
  token_address,
  symbol,
  avg(close) as price
from solana.core.ez_token_prices_hourly p
group by 1, 2, 3
)

  
  select 
  	*,
  	sum(total_tx) over (order by date) as cumulative_tx,
  	sum(total_volume) over (order by date) as cumulative_volume,
  	sum(total_profit) over (order by date) as cumulative_profit
  from (
    select 
  	  s.block_timestamp::date as date,
      sum(swap_from_amount * p.price) as total_volume,
  	  sum((swap_from_amount * p.price) - (swap_to_amount * p2.price)) as total_profit,
      count(distinct tx_id) as total_tx
    from solana.core.fact_swaps s
    join prices p
    on p.token_address = s.swap_from_mint and p.date = s.block_timestamp::date
    join prices p2
    on p2.token_address = s.swap_to_mint and p2.date = s.block_timestamp::date
    where succeeded and swapper = '{{address}}'
    group by 1
  )
  order by date`;

  export const WALLET_STAKE_SUMMARIES_QUERY = `with stake_accounts as (
    select distinct stake_account
    from solana.core.ez_staking_lp_actions
    where stake_authority = '{{address}}'
  ),
  
  stakes as (
    select
            block_timestamp,
          tx_id,
          index,
          event_type,
          stake_account,
          pre_tx_staked_balance,
          post_tx_staked_balance
    from solana.core.ez_staking_lp_actions
    where stake_account in (select stake_account from stake_accounts)
      and succeeded 
  ),
  
  stake_summaries as (
    select
            block_timestamp::date as date,
          sum(case when event_type in ('delegate', 'merge_destination') then post_tx_staked_balance - pre_tx_staked_balance else 0 end) / 1e9 as total_deposit,
          sum(case when event_type in ('withdraw', 'merge_source') then pre_tx_staked_balance - post_tx_staked_balance else 0 end) / 1e9 as total_withdraw,
          total_deposit - total_withdraw as stake_balance_diff
    from stakes
    group by 1
  )
    
  select
        *,
        sum(stake_balance_diff) over (order by date) as total_stake_balance -- negative means total profit
  from stake_summaries
  order by 1`;

  export const TOKEN_DETAILS_QUERY = `
  with
    prices as (
        select 
        token_address,
        symbol,
        avg(close) as price
        from solana.core.ez_token_prices_hourly p
        where recorded_hour >= CURRENT_DATE - 1
        group by 1, 2
    )

    select 
        t.token_address,
        upper(t.symbol) as symbol,
        t.logo,
        p.price
    from solana.core.dim_tokens t
    left join prices p
    on p.token_address = t.token_address
    where t.token_address in ('{{address}}')
`;

export const NFT_TX_QUERY = `
with sol_prices as (
    select 
      date(block_timestamp) as date,
      replace(feed_name, ' / USD') as symbol,
      median(coalesce(latest_answer_adj, latest_answer_unadj / pow(10,8))) as price --using median cause there will be some nulls / zeroes
    from ethereum.chainlink.ez_oracle_feeds
    where feed_category = 'Cryptocurrency (USD pairs)'
      and feed_name in ('SOL / USD')
    group by 1,2
    order by 1
  ),
  
prices as (
select 
  date(recorded_hour) as date,
  token_address,
  symbol,
  avg(close) as price
from solana.core.ez_token_prices_hourly p
group by 1, 2, 3
)
    
    select 
      t.block_timestamp,
      t.tx_id,
      t.tx_from,
      t.tx_to,
      t.mint,
  	  case 
  	  when s.sales_amount is not null then 'Bought'
  	  when m.mint_price is not null then 'Minted'
  	  else 'Gifted' end as obtained_by,
  	  coalesce(upper(tk.symbol), m.mint_currency, 'SOL') as currency,
      coalesce(s.sales_amount, m.mint_price, 0) as amount_currency,
  	  case 
  	  when s.sales_amount is not null then amount_currency * coalesce(p.price, 0)
  	  else amount_currency * coalesce(p2.price, 0) 
  	  end as amount_usd
    from solana.core.fact_transfers t
    left join solana.core.fact_nft_sales s
    on s.mint = t.mint and s.tx_id = t.tx_id
    left join solana.core.fact_nft_mints m
    on s.mint = t.mint and m.tx_id = t.tx_id
    left join solana.core.dim_tokens tk
    on m.mint_currency = tk.token_address
    left join sol_prices p
    on p.date = t.block_timestamp::date
    left join prices p2
    on p2.date = t.block_timestamp::date and p2.token_address = m.mint_currency
    where t.tx_to in ('{{address}}') and t.mint in ('{{mints}}')
    qualify t.block_timestamp = last_value(t.block_timestamp) over (partition by t.mint order by t.block_timestamp) -- latest transfer only
`;